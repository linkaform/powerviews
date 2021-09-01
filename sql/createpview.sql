create domain pv_doc as jsonb
	constraint "pv_doc must be object and include file_url and file_name"
	check (value ? 'file_url' and value ? 'file_name')
	constraint "pv_doc.file_url must be string"
	check (jsonb_typeof(value -> 'file_url') = 'string')
	constraint "pv_doc.file_name must be string"
	check (jsonb_typeof(value -> 'file_name') = 'string')
	;

create or replace function
isjsontype(typearg regtype)
returns boolean
language plpgsql
as $func$
-- receives as argument a postgresql variable representing a datatype,
-- returns true if that datatype can be used to generate values that have a
-- datatype that is implemented on top of regular json.
-- returns false otherwise.
--
-- this function is specially useful to detect domains that are implemented on
-- top of the regular json to add constraints.
--
-- Example:
-- 	isjsontype('pv_doc'::regtype) -- returns true
-- 	isjsontype('json'::regtype) -- returns true
-- 	isjsontype('jsonb'::regtype) -- returns false
-- 	isjsontype('timestamptz'::regtype) -- returns false
-- 	isjsontype('string'::regtype) -- returns false
declare
	res boolean := false;
begin
	execute format('select json_typeof(null::%s) is null;', typearg) into strict res;
	return res;
exception
	when syntax_error_or_access_rule_violation then
		raise notice '%', sqlerrm; -- debug
		return false;
end;
$func$;

create or replace function
isjsonbtype(typearg regtype)
returns boolean
language plpgsql
as $func$
-- receives as argument a postgresql variable representing a datatype,
-- returns true if that datatype can be used to generate values that have a
-- datatype that is implemented on top of regular jsonb.
-- returns false otherwise.
--
-- this function is specially useful to detect domains that are implemented on
-- top of the regular jsonb to add constraints.
--
-- Example:
-- 	isjsonbtype('pv_doc'::regtype) -- returns true
-- 	isjsonbtype('json'::regtype) -- returns false
-- 	isjsonbtype('jsonb'::regtype) -- returns true
-- 	isjsonbtype('timestamptz'::regtype) -- returns false
-- 	isjsonbtype('string'::regtype) -- returns false
declare
	res boolean := false;
begin
	execute format('select jsonb_typeof(null::%s) is null;', typearg) into strict res;
	return res;
exception
	when syntax_error_or_access_rule_violation then
		raise notice '%', sqlerrm; -- debug
		return false;
end;
$func$;

create or replace function
createpview(tname regclass, vname text, ischema jsonb, oschema jsonb)
returns boolean
language plpgsql
set search_path from current
as $func$
-- create powerview, receives as input:
--	tname: table name, guaranteed to exist
--	vname: destination view name
--	ischema: input json schema of data in tname
--	oschema: output json schema of data in vname
declare
	ischema_len int; -- len of input schema jsonb array
	oschema_len int; -- len of output schema jsonb array
	ischema_key text;
	oschema_key text;
	ischema_val text;
	ischema_val_t regtype; -- input schema value as regtype type (datatype)
	oschema_val text;
	oschema_val_t regtype; -- output schema value as regtype type (datatype)
	oschema_val_idx int; -- output schema index of element inside array
	oschema_val_el text; -- output schema key of element inside object
	cols text[] := array[]::text[];
	sql text := '';
	ikeyregex text := '^[a-zA-Z][a-zA-Z0-9_]+$'; -- regex for keys in input schema
	keyvalregex text := '^[a-zA-Z][a-zA-Z0-9_]+$'; -- regex for keys and values of everything else
begin
	if vname is null then
		raise 'vname is null';
	end if;
	if vname = '' then
		raise 'vname is empty';
	end if;
	if ischema is null then
		raise 'ischema is null';
	end if;
	if oschema is null then
		raise 'oschema is null';
	end if;

	ischema_len := jsonb_array_length(ischema);
	oschema_len := jsonb_array_length(oschema);

	if ischema_len != oschema_len then
		raise 'length of ischema (%) != length of oschema (%)',
			ischema_len, oschema_len;
	end if;

	for i in 0 .. (ischema_len - 1) loop
		raise notice 'ischema[%]: %, oschema[%]: %', i, ischema -> i, i, oschema -> i;

		begin
			-- raise if ischema element includes several keys
			select	key, value
			into	strict
				ischema_key, ischema_val
			from	jsonb_each_text(ischema -> i);
		exception
			when others then
				raise 'cannot get valid key-value pair from ischema[%] element (%): %', i, ischema -> i, sqlerrm;
		end;

		begin
			-- raise if oschema element includes several keys
			select	key, value
			into	strict
				oschema_key, oschema_val
			from	jsonb_each_text(oschema -> i);
		exception
			when others then
				raise 'cannot get valid key-value pair from oschema[%] element (%): %', i, oschema -> i, sqlerrm;
		end;

		if ischema_key !~ ikeyregex then
			raise 'invalid ischema_key: %', ischema_key;
		elsif ischema_val !~ keyvalregex then
			raise 'invalid ischema_val: %', ischema_val;
		elsif oschema_key !~ keyvalregex then
			raise 'invalid oschema_key: %', oschema_key;
		elsif oschema_val !~ keyvalregex then
			raise 'invalid oschema_val: %', oschema_val;
		end if;

		ischema_val := regexp_replace(ischema_val, '^array_(.+?)(?:__.+)?$', '\1[]');
		-- transform arrays to something postgresql can understand
		ischema_val := regexp_replace(ischema_val, '^array_(.+?)(?:__.+)?$', '\1[]');

		-- split index values into type and index of element
		select	match[1],
			-- right hand of double underscore is digit means index
			-- in array
			case when match[2] ~ '^\d+$' then
				match[2]::int
			else
				null
			end::int,
			-- right hand of double underscore not digit means key
			-- inside jsonb object
			case when match[2] !~ '^\d+$' then
				match[2]
			else
				null
			end::text
		into	strict oschema_val, oschema_val_idx, oschema_val_el
		from	regexp_match(oschema_val, '^(.+?)(?:__([0-9a-zA-Z_]+?))?$') as t(match);

		-- convert to proper postgresql datatype
		ischema_val_t := ischema_val::regtype;

		-- convert to proper postgresql datatype
		oschema_val_t := oschema_val::regtype;

		ischema_key := format('(data -> %L)', ischema_key);
		raise notice 'ischema_key: %, ischema_val_t: %', ischema_key, ischema_val_t;
		raise notice 'oschema_key: %, oschema_val_t: %, oschema_val_idx: %, oschema_val_el: %', oschema_key, oschema_val_t, oschema_val_idx, oschema_val_el;

		-- input is array type
		if ischema_val_t::text ~ '\[\]$' and oschema_val_idx is null then
			raise 'specified array type on input but did not requested array element on output: input: %, output: %', ischema -> i, oschema -> i;
		elsif ischema_val_t::text ~ '\[\]$' and oschema_val_idx >= 0 then
			cols := cols || format('(%s ->> %L::int)::%s as %I', ischema_key, oschema_val_idx, oschema_val_t, oschema_key);
		-- input is jsonb or a jsonb-derived type
		elsif isjsontype(ischema_val_t) or isjsonbtype(ischema_val_t) then
			cols := cols || format('(%s ->> %L) as %I', ischema_key, oschema_val_el, oschema_key);
		-- input is regular type
		else
			cols := cols || format('%s::text::%s as %I', ischema_key, oschema_val_t, oschema_key);
		end if;

	end loop;

	sql := format($$create view %s as select %s from %s;$$, vname, array_to_string(cols, ', '), tname);
	raise notice 'sql: %', sql;
	execute sql;

	return true;
end;
$func$;
