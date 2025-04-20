import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="container flex flex-col items-center justify-center space-y-8 py-16 md:py-24">
      <h1 className="text-center text-4xl font-bold tracking-tight md:text-6xl">
        Welcome to <span className="text-primary">VideoMe</span>
      </h1>
      <p className="max-w-[42rem] text-center text-lg text-muted-foreground md:text-xl">
        A modern video conferencing platform for seamless communication
      </p>
      <div className="flex gap-4">
        <Button size="lg">Start a Meeting</Button>
        <Button size="lg" variant="outline">
          Join a Meeting
        </Button>
      </div>
    </div>
  );
}
