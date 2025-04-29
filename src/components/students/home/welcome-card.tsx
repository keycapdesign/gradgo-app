import { Calendar, Info } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface WelcomeCardProps {
  firstName: string;
  ceremonyName: string;
  bookingDate: string;
  bookingLocation: string;
  backgroundImage: string;
}

export function WelcomeCard({
  firstName,
  ceremonyName,
  bookingDate,
  bookingLocation,
  backgroundImage,
}: WelcomeCardProps) {
  return (
    <Card
      className="border-primary/20"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Welcome back, {firstName}!</CardTitle>
        <CardDescription>Your graduation journey at a glance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md bg-background/80 p-4 backdrop-blur-sm">
          <h3 className="font-medium">{ceremonyName}</h3>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{bookingDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <span>{bookingLocation}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
