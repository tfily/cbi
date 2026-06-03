import { buildBusinessCardVcf } from "../../../lib/business-card";

export function GET() {
  return new Response(buildBusinessCardVcf(), {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="conciergerie-by-isa-isabelle-haquin.vcf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
