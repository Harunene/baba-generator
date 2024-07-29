import Main from '@/components/main';
import { Metadata, ResolvingMetadata } from 'next'

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string }
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return {
    title: 'baba generator',
    description: 'baba 이미지 생성기',
    openGraph: {
      type: "article",
      title: 'baba generator',
      description: 'baba 이미지 생성기',
      images: '/public/og-image.png'
    },
    twitter: {
      card: "summary_large_image",
      title: 'baba generator',
      description: 'baba 이미지 생성기',
      images: '/public/og-image.png'
    }
  }
}

export default function Home() {
  return (
    <Main></Main>
  );
}
