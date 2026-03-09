import { LucideIcon, MapPin, Globe, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimelineEventProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  date: string;
  location?: string;
  ipAddress?: string;
  device?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  isLast?: boolean;
}

export function TimelineEvent({ 
  icon: Icon, 
  iconColor, 
  title, 
  date, 
  location, 
  ipAddress, 
  device, 
  description,
  action,
  isLast = false 
}: TimelineEventProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div 
          className={`size-12 rounded-full flex items-center justify-center ${iconColor}`}
        >
          <Icon className="size-6 text-white" aria-hidden="true" />
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gray-200 border-dashed my-2 min-h-[40px]" aria-hidden="true" />
        )}
      </div>

      <div className="flex-1 pb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-base font-semibold text-slate-800 mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">{date}</p>

          {location && (
            <p className="text-sm text-gray-700 mb-1 flex items-center gap-1.5">
              <MapPin className="size-3.5 text-gray-500 flex-shrink-0" aria-hidden="true" />
              <span>{location}</span>
            </p>
          )}
          {ipAddress && (
            <p className="text-sm text-gray-700 mb-1 flex items-center gap-1.5">
              <Globe className="size-3.5 text-gray-500 flex-shrink-0" aria-hidden="true" />
              <span>IP: {ipAddress}</span>
            </p>
          )}
          {device && (
            <p className="text-sm text-gray-700 mb-3 flex items-center gap-1.5">
              <Monitor className="size-3.5 text-gray-500 flex-shrink-0" aria-hidden="true" />
              <span>{device}</span>
            </p>
          )}

          {description && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-xs text-gray-700">{description}</p>
            </div>
          )}

          {action && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
