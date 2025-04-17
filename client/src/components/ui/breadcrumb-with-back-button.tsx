import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface BreadcrumbItem {
  title: string;
  link: string;
}

interface BreadcrumbWithBackButtonProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbWithBackButton({ items }: BreadcrumbWithBackButtonProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button variant="ghost" size="sm" asChild>
        <Link href={items.length > 1 ? items[items.length - 2].link : "/"}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>
      </Button>
      <div className="mx-2 flex items-center text-sm text-muted-foreground">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="mx-1 h-4 w-4" />}
            {index === items.length - 1 ? (
              <span className="font-medium text-foreground">{item.title}</span>
            ) : (
              <Link href={item.link} className="hover:text-foreground">
                {item.title}
              </Link>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}