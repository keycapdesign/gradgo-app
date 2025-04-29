import { Link } from '@tanstack/react-router';

import { QuickAccessCardProps } from './types';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export function QuickAccessCard({ title, description, icon: Icon, to }: QuickAccessCardProps) {
  return (
    <Link to={to} className="block h-full transition-transform hover:scale-[1.02]">
      <Card className="h-full overflow-hidden hover:border-primary/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <CardDescription className="pt-1">{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
