-- Lets the admin read the tables the bookings inbox needs.
--
-- payments, invoices and notifications have RLS enabled but no policy, which
-- means deny-all — correct while unused, but the admin panel needs to show
-- payment status and history alongside each booking. bookings itself already
-- has an is_admin() policy from 0006.

drop policy if exists "payments admin all" on public.payments;
create policy "payments admin all"
  on public.payments
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "invoices admin all" on public.invoices;
create policy "invoices admin all"
  on public.invoices
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "notifications admin read" on public.notifications;
create policy "notifications admin read"
  on public.notifications
  for select
  to authenticated
  using (public.is_admin());
