import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

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
    <Link href={href} className="block">
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-blue-500/10 cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardHeader className="pb-3 relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              {icon}
            </div>
            <CardTitle className="text-xl font-bold">{title}</CardTitle>
          </div>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-4 sm:overflow-x-auto pb-2">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/30 group-hover:bg-muted/70 dark:group-hover:bg-muted/50 transition-colors duration-300 sm:min-w-[200px] sm:flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-background dark:bg-background/80 flex items-center justify-center flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="text-sm">
                  <p className="font-medium">{feature.title}</p>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="relative">
          <div className="w-full flex items-center justify-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            {buttonText}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}

