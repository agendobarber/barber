import { Card, CardContent } from "./ui/card"

const Footer = () => {
  return (
    <footer className="mt-10">
      <Card>
        <CardContent className="px-5 py-4 text-center">
          <p className="text-sm text-gray-400">
            &copy; 2025 Copyright <span className="font-bold">Osvaldo Deschamps Neto</span>
          </p>
        </CardContent>
      </Card>
    </footer>
  )
}

export default Footer
