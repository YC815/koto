import { getVocabs } from '@/app/actions/vocabulary';
import { HomePage } from '@/components/home-page';

export default async function Page() {
  const result = await getVocabs();
  const initialVocabs = result.success ? result.data : [];

  return <HomePage initialVocabs={initialVocabs} />;
}
