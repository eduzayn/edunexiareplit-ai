import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepProps {
  id: string;
  title: string;
  description?: string;
  status: 'complete' | 'current' | 'upcoming' | 'error';
}

export interface StepperProps {
  steps: StepProps[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Stepper({ steps, orientation = 'horizontal', className }: StepperProps) {
  const isVertical = orientation === 'vertical';
  
  return (
    <div 
      className={cn(
        'w-full',
        isVertical ? 'flex flex-col space-y-2' : 'flex items-center justify-between',
        className
      )}
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        
        return (
          <React.Fragment key={step.id}>
            <div 
              className={cn(
                'flex',
                isVertical ? 'flex-row items-start' : 'flex-col items-center justify-center'
              )}
            >
              {/* Step indicator */}
              <div className="relative flex items-center justify-center">
                <div 
                  className={cn(
                    'h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold',
                    step.status === 'complete' && 'border-green-500 bg-green-500 text-white',
                    step.status === 'current' && 'border-blue-500 bg-white text-blue-500',
                    step.status === 'upcoming' && 'border-gray-300 bg-white text-gray-400',
                    step.status === 'error' && 'border-red-500 bg-red-500 text-white'
                  )}
                >
                  {step.status === 'complete' && <Check className="h-4 w-4" />}
                  {step.status === 'error' && <X className="h-4 w-4" />}
                  {(step.status === 'current' || step.status === 'upcoming') && (index + 1)}
                </div>
              </div>
              
              {/* Step content */}
              <div className={cn(
                isVertical ? 'ml-3' : 'mt-2',
                isVertical ? 'flex-1' : 'text-center'
              )}>
                <div className={cn(
                  'text-sm font-medium',
                  step.status === 'complete' && 'text-green-600',
                  step.status === 'current' && 'text-blue-600',
                  step.status === 'upcoming' && 'text-gray-500',
                  step.status === 'error' && 'text-red-600'
                )}>
                  {step.title}
                </div>
                {step.description && (
                  <div className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
            
            {/* Connector */}
            {!isLast && (
              <div 
                className={cn(
                  isVertical ? 'ml-4 h-8 border-l-2 border-gray-300' : 'flex-1 border-t-2 border-gray-300 mx-2'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}