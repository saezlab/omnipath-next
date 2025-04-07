import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  features: Array<{
    icon: ReactNode
    title: string
    description: string
  }>
  href: string
  buttonText: string
}

export function FeatureCard({ icon, title, description, features, href, buttonText }: FeatureCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">{icon}</div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              {feature.icon}
              <div className="text-sm">
                <p className="font-medium">{feature.title}</p>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild>
          <Link href={href}>
            {buttonText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

