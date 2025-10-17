"use client"

import { Menu, FolderOpen, Save, Download, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface MobileNavProps {
  onOpen?: () => void
  onSave?: () => void
  onExport?: () => void
  onSettings?: () => void
}

export function MobileNav({ onOpen, onSave, onExport, onSettings }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col space-y-4 mt-6">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={onOpen}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Open
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={onSave}
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={onExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={onSettings}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}