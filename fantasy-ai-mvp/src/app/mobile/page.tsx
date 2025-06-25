'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Download, Globe, Rocket } from 'lucide-react';

export default function MobilePage() {
  useEffect(() => {
    // Check if on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Add viewport meta tag for better mobile experience
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
      }
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Fantasy.AI Mobile
        </h1>
        <p className="text-lg text-muted-foreground">
          Experience Fantasy.AI on your mobile device
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Progressive Web App */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Web App (Available Now)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use Fantasy.AI right now in your mobile browser. Add to home screen for app-like experience.
            </p>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => window.location.href = '/'}>
                Open Web App
              </Button>
              <div className="text-xs text-center text-muted-foreground">
                Works on: Chrome, Safari, Firefox
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-semibold mb-1">Features:</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>✓ Real-time updates</li>
                <li>✓ AI insights & predictions</li>
                <li>✓ League management</li>
                <li>✓ Player analytics</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Native App */}
        <Card className="border-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Native App (Coming Soon)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Full native experience with advanced features like voice commands, AR, and biometric auth.
            </p>
            <div className="space-y-2">
              <Button className="w-full" variant="secondary" disabled>
                <Download className="mr-2 h-4 w-4" />
                Download for Android
              </Button>
              <Button className="w-full" variant="secondary" disabled>
                <Download className="mr-2 h-4 w-4" />
                Download for iOS
              </Button>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-semibold mb-1">Additional Features:</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Voice assistant ("Hey Fantasy")</li>
                <li>• AR player cards</li>
                <li>• Biometric login</li>
                <li>• Offline support</li>
                <li>• Push notifications</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add to Home Screen Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Quick Setup: Add to Home Screen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-sm mb-2">For Android (Chrome):</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open Fantasy.AI in Chrome</li>
                <li>Tap the menu (3 dots) in top-right</li>
                <li>Select "Add to Home screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>
            <div>
              <p className="font-semibold text-sm mb-2">For iPhone (Safari):</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open Fantasy.AI in Safari</li>
                <li>Tap the share button (square with arrow)</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" in top-right</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}