"use client"

import { MessageSquare, Mail, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function FeedbackDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-10 px-3 gap-2 text-sm font-medium hover:bg-background hover:text-foreground"
        >
          <MessageSquare className="h-4 w-4" />
          Submit Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Feedback</DialogTitle>
          <DialogDescription>
            Help us improve OmniPath! Report bugs, request features, or share your thoughts.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Button
            asChild
            className="w-full justify-start gap-3"
            variant="default"
          >
            <a 
              href="https://github.com/saezlab/omnipath-next/issues/new" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Report Issue on GitHub
            </a>
          </Button>
          
          <Button
            asChild
            className="w-full justify-start gap-3 hover:bg-background hover:text-foreground"
            variant="outline"
          >
            <a 
              href="mailto:omnipathdb@gmail.com?subject=OmniPath%20Feedback"
            >
              <Mail className="h-4 w-4" />
              Send Email Feedback
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}