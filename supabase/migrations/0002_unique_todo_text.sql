-- Todo text is unique, ignoring case and surrounding whitespace, so the same
-- task cannot be added twice. The app checks first and returns a friendly 409;
-- this index is what makes the rule hold under concurrent inserts and for
-- writes that do not go through the app.
--
-- If this migration fails with "could not create unique index", the table
-- already contains duplicates. List them with:
--
--   select lower(btrim(todo)) as normalised, count(*), array_agg(id)
--   from public.todos
--   group by 1 having count(*) > 1;
--
-- then delete the rows you do not want to keep and re-run this file.

create unique index if not exists todos_unique_text_idx
  on public.todos (lower(btrim(todo)));
