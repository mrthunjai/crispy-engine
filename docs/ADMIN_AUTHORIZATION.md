# KESHEV authorization

## Roles

Supabase Auth owns identity. The application role is stored in `public.user_roles` and is checked against the authenticated session user ID. The browser cannot choose or submit an admin role.

## First-admin bootstrap

1. Create and verify the first account through the normal KESHEV signup flow.
2. In the Supabase SQL Editor, copy that user’s ID from Authentication → Users.
3. As the project owner, run the following SQL with the real UUID substituted:

```sql
insert into public.user_roles (user_id, role)
values ('AUTH_USER_UUID', 'admin')
on conflict (user_id) do update set role = excluded.role;
```

Do not expose this operation through a public route, client component, or signup form. For production, record who approved the role assignment and remove admin access by deleting the row or changing the role when required.

## Server authorization

- `app/lib/supabase/authorization.ts` obtains the authenticated user from the server session.
- Admin status is checked against `public.user_roles` using that session user ID.
- `app/api/inventory/route.ts` returns `401` without a valid session and `403` for authenticated non-admin users.
- `app/admin/inventory/page.tsx` redirects unauthenticated users to `/account` and non-admin users to `/`.
- `app/lib/supabase-rest.ts` and `app/lib/supabase/server.ts` are server-only modules. The secret key is never available to client components.

## Access checks

The existing RLS policies should be checked locally after `supabase db reset` or against a disposable hosted test project:

1. Anonymous users cannot read `profiles`, `carts`, `orders`, or `user_roles`.
2. A customer can read and update only their own profile.
3. A customer cannot read another customer’s profile, cart, order, or address.
4. A guest cart is accessible only through its own HTTP-only guest token handled by the server.
5. A normal authenticated customer cannot read or modify inventory or other admin tables.
6. An admin can access the intended admin inventory operations.
7. Missing sessions return `401` from protected server routes.
8. Authenticated non-admin sessions return `403` from protected admin server routes.

These checks must not be made to pass by weakening RLS or by trusting IDs, roles, or ownership fields supplied by the browser.
