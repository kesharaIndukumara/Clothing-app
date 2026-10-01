"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { SIZES } from "@/lib/config";
import { saveProduct } from "./actions";

type Variant = { id?: string; key: string; size: string; color: string; colorHex: string; sku: string; stock: number };
type ProductInput = {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
  price: number;
  compareAtPrice: number | null;
  description: string;
  fabric: string;
  care: string;
  fitNote: string;
  featured: boolean;
  active: boolean;
  images: string[];
  variants: Omit<Variant, "key">[];
};

let keySeq = 0;
const newKey = () => `v${++keySeq}`;

export function ProductForm({ categories, product }: { categories: { id: string; name: string }[]; product?: ProductInput }) {
  const [state, formAction] = useActionState(saveProduct, null);
  const [pending, startTransition] = useTransition();
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);
  const [variants, setVariants] = useState<Variant[]>(
    product?.variants.map((v) => ({ ...v, key: newKey() })) ?? [],
  );

  // Quick-add helper state
  const [genSizes, setGenSizes] = useState<string[]>(["S", "M", "L", "XL"]);
  const [genColor, setGenColor] = useState("");
  const [genHex, setGenHex] = useState("#1f1f1f");
  const [genStock, setGenStock] = useState(10);

  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.preview)), [files]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.delete("newImagesPicker");
    files.forEach((f) => fd.append("newImages", f.file));
    fd.set("variants", JSON.stringify(variants.map((v) => ({ id: v.id, size: v.size, color: v.color, colorHex: v.colorHex, sku: v.sku, stock: v.stock }))));
    fd.set("keepImages", JSON.stringify(images));
    startTransition(() => formAction(fd));
  }

  function addColour() {
    const color = genColor.trim();
    if (!color || genSizes.length === 0) return;
    setVariants((prev) => {
      const existing = new Set(prev.map((v) => `${v.color.toLowerCase()}|${v.size}`));
      const prefix = (product?.slug ?? "SKU").slice(0, 6).toUpperCase();
      const added = genSizes
        .filter((s) => !existing.has(`${color.toLowerCase()}|${s}`))
        .map((size) => ({ key: newKey(), size, color, colorHex: genHex, sku: `${prefix}-${color.slice(0, 3).toUpperCase()}-${size}`, stock: genStock }));
      return [...prev, ...added];
    });
    setGenColor("");
  }

  const updateVariant = (key: string, patch: Partial<Variant>) =>
    setVariants((prev) => prev.map((v) => (v.key === key ? { ...v, ...patch } : v)));

  const moveImage = (i: number, dir: -1 | 1) =>
    setImages((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const totalStock = variants.reduce((a, v) => a + (Number(v.stock) || 0), 0);

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="space-y-6">
        <section className="space-y-4 rounded-xl border border-line bg-card p-5">
          <div>
            <label className="label" htmlFor="name">Product name</label>
            <input id="name" name="name" defaultValue={product?.name} className="input" required />
          </div>
          <div>
            <label className="label" htmlFor="description">Description</label>
            <textarea id="description" name="description" defaultValue={product?.description} rows={4} className="input" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="fabric">Fabric</label>
              <input id="fabric" name="fabric" defaultValue={product?.fabric} className="input" placeholder="100% cotton" />
            </div>
            <div>
              <label className="label" htmlFor="fitNote">Fit note</label>
              <input id="fitNote" name="fitNote" defaultValue={product?.fitNote} className="input" placeholder={`Model is 5'7" wearing S`} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="care">Care instructions</label>
            <input id="care" name="care" defaultValue={product?.care} className="input" placeholder="Machine wash cold" />
          </div>
        </section>

        {/* Images */}
        <section className="rounded-xl border border-line bg-card p-5">
          <h2 className="mb-1 font-medium">Images</h2>
          <p className="mb-4 text-xs text-muted">The first image is the main photo. JPG, PNG or WebP, under 5 MB each. Portrait (4:5) works best.</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((src, i) => (
              <div key={src} className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-line bg-line">
                <img src={src} alt="" className="h-full w-full object-cover" />
                {i === 0 && <span className="absolute top-1 left-1 rounded bg-ink px-1.5 py-0.5 text-[10px] text-paper">Main</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 text-xs text-white">
                  <button type="button" onClick={() => moveImage(i, -1)} className="px-1.5" aria-label="Move left">←</button>
                  <button type="button" onClick={() => setImages((p) => p.filter((u) => u !== src))} className="px-1.5">Remove</button>
                  <button type="button" onClick={() => moveImage(i, 1)} className="px-1.5" aria-label="Move right">→</button>
                </div>
              </div>
            ))}
            {files.map((f, i) => (
              <div key={f.preview} className="relative aspect-[4/5] overflow-hidden rounded-lg border-2 border-dashed border-accent">
                <img src={f.preview} alt="" className="h-full w-full object-cover" />
                <span className="absolute top-1 left-1 rounded bg-accent px-1.5 py-0.5 text-[10px] text-white">New</span>
                <button type="button" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="absolute inset-x-0 bottom-0 bg-black/50 p-1 text-xs text-white">Remove</button>
              </div>
            ))}
            <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line text-center text-xs text-muted hover:border-ink">
              <span className="text-2xl">+</span>Add images
              <input
                type="file"
                name="newImagesPicker"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                className="hidden"
                onChange={(e) => {
                  const picked = [...(e.target.files ?? [])].map((file) => ({ file, preview: URL.createObjectURL(file) }));
                  setFiles((p) => [...p, ...picked]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </section>

        {/* Variants */}
        <section className="rounded-xl border border-line bg-card p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-medium">Sizes, colours &amp; stock</h2>
            <span className="text-xs text-muted">{variants.length} variants · {totalStock} in stock</span>
          </div>

          <div className="mb-5 rounded-lg bg-paper p-4">
            <p className="label">Quick add a colour</p>
            <div className="flex flex-wrap gap-1.5">
              {SIZES.map((s) => (
                <label key={s} className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${genSizes.includes(s) ? "border-ink bg-ink text-paper" : "border-line bg-card"}`}>
                  <input type="checkbox" className="hidden" checked={genSizes.includes(s)} onChange={(e) => setGenSizes((p) => (e.target.checked ? [...p, s] : p.filter((x) => x !== s)))} />
                  {s}
                </label>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <input type="color" value={genHex} onChange={(e) => setGenHex(e.target.value)} className="h-10 w-10 cursor-pointer rounded border border-line" aria-label="Colour swatch" />
              <input value={genColor} onChange={(e) => setGenColor(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColour(); } }} placeholder="Colour name, e.g. Navy" className="input w-44 flex-1" />
              <input type="number" min={0} value={genStock} onChange={(e) => setGenStock(Number(e.target.value))} className="input w-20" aria-label="Stock each" title="Stock for each size" />
              <button type="button" onClick={addColour} className="btn-outline btn-sm">Add</button>
            </div>
          </div>

          {variants.length === 0 ? (
            <p className="text-sm text-muted">No variants yet. Use quick add above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-left text-xs text-muted uppercase">
                  <tr><th className="pb-2 font-medium">Colour</th><th className="pb-2 font-medium">Size</th><th className="pb-2 font-medium">SKU</th><th className="pb-2 font-medium">Stock</th><th /></tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.key} className="border-t border-line">
                      <td className="py-1.5 pr-2">
                        <div className="flex items-center gap-1.5">
                          <input type="color" value={v.colorHex} onChange={(e) => updateVariant(v.key, { colorHex: e.target.value })} className="h-8 w-8 shrink-0 cursor-pointer rounded border border-line" aria-label="Swatch" />
                          <input value={v.color} onChange={(e) => updateVariant(v.key, { color: e.target.value })} className="input py-1.5" />
                        </div>
                      </td>
                      <td className="py-1.5 pr-2"><input value={v.size} onChange={(e) => updateVariant(v.key, { size: e.target.value })} className="input w-20 py-1.5" /></td>
                      <td className="py-1.5 pr-2"><input value={v.sku} onChange={(e) => updateVariant(v.key, { sku: e.target.value })} className="input py-1.5" /></td>
                      <td className="py-1.5 pr-2">
                        <input type="number" min={0} value={v.stock} onChange={(e) => updateVariant(v.key, { stock: Number(e.target.value) })}
                          className={`input w-20 py-1.5 ${v.stock === 0 ? "border-red-300 text-red-700" : ""}`} />
                      </td>
                      <td className="py-1.5 text-right">
                        <button type="button" onClick={() => setVariants((p) => p.filter((x) => x.key !== v.key))} className="text-xs text-muted hover:text-red-700">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <section className="space-y-4 rounded-xl border border-line bg-card p-5 lg:sticky lg:top-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="price">Price (Rs)</label>
              <input id="price" name="price" type="number" min={1} defaultValue={product?.price} className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="compareAtPrice">Was (Rs)</label>
              <input id="compareAtPrice" name="compareAtPrice" type="number" min={0} defaultValue={product?.compareAtPrice ?? ""} className="input" placeholder="For sales" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="categoryId">Category</label>
            <select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""} className="input">
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="slug">URL slug</label>
            <input id="slug" name="slug" defaultValue={product?.slug} className="input" placeholder="Auto from name" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={product?.active ?? true} className="accent-ink" /> Visible in store
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} className="accent-ink" /> Featured on home page
          </label>

          {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
          {state?.ok && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{state.ok}</p>}
          <button className="btn w-full" disabled={pending}>{pending ? "Saving…" : product ? "Save changes" : "Create product"}</button>
        </section>
      </div>
    </form>
  );
}
