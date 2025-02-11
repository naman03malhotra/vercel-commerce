import { Carousel } from 'components/carousel';
import { ThreeItemGrid } from 'components/grid/three-items';
import Footer from 'components/layout/footer';
import { Wrapper } from 'components/wrapper';
import { getCart } from 'lib/fourthwall';

export const metadata = {
  description: 'High-performance ecommerce store built with Next.js, Vercel, and Fourthwall.',
  openGraph: {
    type: 'website'
  }
};

export default async function HomePage({ searchParams }: { searchParams: { currency?: string } }) {
  const currency = searchParams.currency || 'USD';
  // Don't await the fetch, pass the Promise to the context provider
  const cart = getCart();

  return (
    <Wrapper currency={currency} cart={cart}>
      <ThreeItemGrid currency={currency} />
      <Carousel currency={currency} />
      <Footer />
    </Wrapper>
  );
}
