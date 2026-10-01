import { store } from "@/lib/config";
export const metadata = { title: "About us" };
export default function AboutPage() {
  return (
    <div className="container-x prose-store max-w-2xl py-12">
      <h1 className="font-display text-4xl">About {store.name}</h1>
      <p className="mt-4">
        {store.name} started with a simple idea: well-made everyday clothes at fair prices, suited to Sri Lankan weather.
        Replace this text with your own story, who you are, where your clothes are made, and what you care about.
      </p>
      <h2>What we stand for</h2>
      <ul>
        <li>Breathable fabrics chosen for heat and humidity</li>
        <li>Honest pricing with no inflated &ldquo;sales&rdquo;</li>
        <li>Easy size exchanges, because fit matters</li>
      </ul>
    </div>
  );
}
