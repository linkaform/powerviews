
create or replace function
createpview(tname regclass, vname text, ischema jsonb, oschema jsonb)
returns boolean
language plpgsql as $func$
-- create powerview, receives as input:
--	tname: table name, guaranteed to exist
--	vname: destination view name
--	ischema: input json schema of data in tname
--	oschema: output json schema of data in vname
declare
	ischema_len int; -- len of input schema jsonb array
	oschema_len int; -- len of output schema jsonb array
	tmp jsonb := null;
	ischema_key text;
	oschema_key text;
	ischema_val text;
	ischema_val_t regtype; -- input schema value as regtype type (datatype)
	oschema_val text;
	oschema_val_t regtype; -- output schema value as regtype type (datatype)
	oschema_val_el int; -- output schema id of element inside array
	cols text[] := array[]::text[];
	sql text := '';
	keyvalregex text := '^[a-zA-Z][a-zA-Z0-9_]+$';
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
		--tmp = ischema -> i;
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

		if ischema_key !~ keyvalregex then
			raise 'invalid ischema_key: %', ischema_key;
		elsif ischema_val !~ keyvalregex then
			raise 'invalid ischema_val: %', ischema_val;
		elsif oschema_key !~ keyvalregex then
			raise 'invalid oschema_key: %', ischema_key;
		elsif oschema_val !~ keyvalregex then
			raise 'invalid oschema_val: %', oschema_val;
		end if;

		-- transform arrays to something postgresql can understand
		ischema_val := regexp_replace(ischema_val, '^array_(.+?)(?:__.+)?$', '\1[]');
		select	match[1],
			match[2]::int + 1 -- contract is 0 based indexes but postgres uses 1 based indexes...
		into	strict oschema_val, oschema_val_el
		from	regexp_match(oschema_val, '^(.+?)(?:__(\d+))?$') as t(match);

		begin
			ischema_val_t := ischema_val::regtype;
		exception
			when others then
				continue; -- XXX ignore unrecognized types by now
		end;

		begin
			oschema_val_t := oschema_val::regtype;
		exception
			when others then
				continue; -- XXX ignore unrecognized types by now
		end;

		raise notice 'ischema_key: %, ischema_val_t: %', ischema_key, ischema_val_t;
		raise notice 'oschema_key: %, oschema_val_t: %, oschema_val_el: %', oschema_key, oschema_val_t, oschema_val_el;

		-- input is array type
		if ischema_val_t::text ~ '\[\]$' then
			cols := cols || format('(select (array_agg(el))[%L]::%s from jsonb_array_elements_text(data -> %L) as j(el)) as %I', oschema_val_el, oschema_val_t, ischema_key, oschema_key);
		else
			cols := cols || format('(data ->> %L)::text::%s as %I', ischema_key, ischema_val_t, oschema_key);
		end if;

	end loop;

	sql := format($$create view %I as select %s from %s where data ->> 'oc_importe' != '';$$, vname, array_to_string(cols, ', '), tname);
	raise notice 'sql: %', sql;
	execute sql;

	return true;
end;
$func$;
