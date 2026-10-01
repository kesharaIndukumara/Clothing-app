import { SizeChart } from "@/components/size-chart";
export const metadata = { title: "Size guide" };
export default function SizeGuidePage() {
  return (
    <div className="container-x prose-store max-w-2xl py-12">
      <h1 className="font-display text-4xl">Size guide</h1>
      <p className="mt-3">Measure yourself over light clothing and compare with the chart below.</p>
      <div className="mt-6"><SizeChart /></div>
      <h2>How to measure</h2>
      <ul>
        <li><strong>Chest:</strong> around the fullest part of your chest, under the arms.</li>
        <li><strong>Waist:</strong> around your natural waistline, the narrowest part.</li>
        <li><strong>Hip:</strong> around the fullest part of your hips.</li>
      </ul>
      <p className="mt-4">Still unsure? Message us on WhatsApp with your height and usual size and we&apos;ll help.</p>
    </div>
  );
}
