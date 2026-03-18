create policy "users can delete their own people"
on public.people
for delete
to authenticated
using (auth.uid() = created_by);
