import { redirect } from 'next/navigation';

export default function ArticlesRedirect({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/learn/${params.slug}`);
}
