import BarbershopItem from "../_components/barber-shop-item";
import Header from "../_components/header";
import Search from "../_components/search";
import { db } from "../_lib/prisma";

const BarbershopsPage = async ({ searchParams }: any) => {
  // Next.js infere searchParams como Record<string, string | string[] | undefined>
  const title = Array.isArray(searchParams?.title) ? searchParams.title[0] : searchParams?.title;
  const service = Array.isArray(searchParams?.service) ? searchParams.service[0] : searchParams?.service;

  const barbershops = await db.barbershop.findMany({
    where: {
      OR: [
        title
          ? {
              name: {
                contains: title,
                mode: "insensitive" as const,
              },
            }
          : undefined,
        service
          ? {
              services: {
                some: {
                  name: {
                    contains: service,
                    mode: "insensitive" as const,
                  },
                },
              },
            }
          : undefined,
      ].filter((x): x is NonNullable<typeof x> => x !== undefined),
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="p-5 md:p-10 max-w-7xl mx-auto">
        <div className="my-6">
          <Search />
        </div>

        <h2 className="mb-3 mt-6 text-xs md:text-sm font-bold uppercase text-gray-400">
          Resultados para &quot;{title || service}&quot;
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {barbershops.map((barbershop) => (
            <BarbershopItem key={barbershop.id} barbershop={barbershop} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BarbershopsPage;
