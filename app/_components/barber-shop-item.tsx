import { Barbershop } from "@prisma/client"
import { Card, CardContent } from "./ui/card"
import Image from "next/image"
import { Button } from "./ui/button"
import Link from "next/link"

interface BarbershopItemProps {
  barbershop: Barbershop
}

const BarbershopItem = ({ barbershop }: BarbershopItemProps) => {
  return (
    <Card className="min-w-[159px] md:min-w-[200px] lg:min-w-[250px] overflow-hidden">
      <CardContent className="p-0">
        {/* IMAGEM */}
        <div className="relative h-[140px] md:h-[180px] lg:h-[200px] w-full">
          <Image
            alt={barbershop.name}
            fill
            unoptimized
            className="object-cover"
            src={barbershop.imageUrl}
          />

        </div>

        {/* TEXTO */}
        <div className="px-2 py-2 md:px-3 md:py-3">
          <h3 className="truncate text-sm md:text-base font-semibold">{barbershop.name}</h3>
          <p className="truncate text-xs md:text-sm text-gray-400">{barbershop.address}</p>
          <Button variant="secondary" size="sm" className="mt-2 w-full" asChild>
            <Link href={`/barbershops/${barbershop.id}`}>Reservar</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default BarbershopItem
