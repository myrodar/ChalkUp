
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Boulder } from '@/types';
import { useTranslation } from '@/hooks/use-translation';

// Define form schema
const boulderSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  color: z.string().min(1, { message: 'Color is required.' }),
  maxPoints: z.coerce.number().min(1, { message: 'Max points must be at least 1.' }),
  maxZonePoints: z.coerce.number().min(1, { message: 'Max zone points must be at least 1.' }),
  pointsForFirst: z.coerce.number().min(1, { message: 'Points must be at least 1.' }),
  pointsForSecond: z.coerce.number().min(1, { message: 'Points must be at least 1.' }),
  pointsForThird: z.coerce.number().min(1, { message: 'Points must be at least 1.' }),
  pointsForFourth: z.coerce.number().min(1, { message: 'Points must be at least 1.' }),
  pointsForFifth: z.coerce.number().min(1, { message: 'Points must be at least 1.' }),
  pointsForZone: z.coerce.number().min(1, { message: 'Points must be at least 1.' }),
  isActive: z.boolean().default(true),
  order: z.coerce.number().min(0),
});

type BoulderFormValues = z.infer<typeof boulderSchema>;

// Color options
const colorOptions = [
  { value: 'red', label: 'Red' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'black', label: 'Black' },
  { value: 'white', label: 'White' },
  { value: 'purple', label: 'Purple' },
  { value: 'orange', label: 'Orange' },
  { value: 'pink', label: 'Pink' },
  { value: 'gray', label: 'Gray' },
];

interface AdminBoulderFormProps {
  onSubmit: (data: Omit<Boulder, 'id'>) => void;
  boulder?: Boulder;
  isLoading?: boolean;
  competitionId?: number;
}

const AdminBoulderForm = ({ onSubmit, boulder, isLoading = false, competitionId }: AdminBoulderFormProps) => {
  const { t } = useTranslation();
  const isEditing = !!boulder;

  // Function to calculate points based on max points and attempt number
  const calculatePointsForAttempt = (maxPoints: number, attemptNumber: number): number => {
    if (attemptNumber <= 0) return 0;
    // 5% reduction per attempt after the first
    const reduction = (attemptNumber - 1) * 0.05;
    // Calculate points and ensure it's an integer
    return Math.max(1, Math.round(maxPoints * (1 - reduction)));
  };

  // Default max points
  const defaultMaxPoints = 100;
  const defaultMaxZonePoints = 50;

  // Calculate default points based on max points
  const getDefaultPoints = (maxPoints: number) => ({
    pointsForFirst: calculatePointsForAttempt(maxPoints, 1),
    pointsForSecond: calculatePointsForAttempt(maxPoints, 2),
    pointsForThird: calculatePointsForAttempt(maxPoints, 3),
    pointsForFourth: calculatePointsForAttempt(maxPoints, 4),
    pointsForFifth: calculatePointsForAttempt(maxPoints, 5),
  });

  // Determine initial max points from boulder or default
  const initialMaxPoints = boulder ?
    Math.max(boulder.pointsForFirst, defaultMaxPoints) : defaultMaxPoints;

  const initialMaxZonePoints = boulder ?
    Math.max(boulder.pointsForZone, defaultMaxZonePoints) : defaultMaxZonePoints;

  const form = useForm<BoulderFormValues>({
    resolver: zodResolver(boulderSchema),
    defaultValues: boulder ? {
      name: boulder.name,
      color: boulder.color,
      maxPoints: initialMaxPoints,
      maxZonePoints: initialMaxZonePoints,
      pointsForFirst: boulder.pointsForFirst,
      pointsForSecond: boulder.pointsForSecond,
      pointsForThird: boulder.pointsForThird,
      pointsForFourth: boulder.pointsForFourth,
      pointsForFifth: boulder.pointsForFifth,
      pointsForZone: boulder.pointsForZone,
      isActive: boulder.isActive,
      order: boulder.order,
    } : {
      name: '',
      color: 'red',
      maxPoints: defaultMaxPoints,
      maxZonePoints: defaultMaxZonePoints,
      ...getDefaultPoints(defaultMaxPoints),
      pointsForZone: defaultMaxZonePoints,
      isActive: true,
      order: 0,
    },
  });

  // Watch maxPoints to update other points when it changes
  const maxPoints = form.watch('maxPoints');
  const maxZonePoints = form.watch('maxZonePoints');

  // Update points when maxPoints changes
  useEffect(() => {
    if (maxPoints) {
      form.setValue('pointsForFirst', calculatePointsForAttempt(maxPoints, 1));
      form.setValue('pointsForSecond', calculatePointsForAttempt(maxPoints, 2));
      form.setValue('pointsForThird', calculatePointsForAttempt(maxPoints, 3));
      form.setValue('pointsForFourth', calculatePointsForAttempt(maxPoints, 4));
      form.setValue('pointsForFifth', calculatePointsForAttempt(maxPoints, 5));
    }
  }, [maxPoints, form]);

  // Update zone points when maxZonePoints changes
  useEffect(() => {
    if (maxZonePoints) {
      form.setValue('pointsForZone', maxZonePoints);
    }
  }, [maxZonePoints, form]);

  const handleSubmit = (data: BoulderFormValues) => {
    // Calculate points based on max points
    const pointsForFirst = calculatePointsForAttempt(data.maxPoints, 1);
    const pointsForSecond = calculatePointsForAttempt(data.maxPoints, 2);
    const pointsForThird = calculatePointsForAttempt(data.maxPoints, 3);
    const pointsForFourth = calculatePointsForAttempt(data.maxPoints, 4);
    const pointsForFifth = calculatePointsForAttempt(data.maxPoints, 5);
    const pointsForZone = data.maxZonePoints;

    // Ensure all required fields are present and not undefined
    const boulderData: Omit<Boulder, 'id'> = {
      name: data.name,
      color: data.color,
      pointsForFirst,
      pointsForSecond,
      pointsForThird,
      pointsForFourth,
      pointsForFifth,
      pointsForZone,
      pointsForSend: pointsForFirst, // Set pointsForSend to match pointsForFirst
      isActive: data.isActive,
      order: data.order,
      competitionId: competitionId || 0, // Ensure competitionId is not undefined
    };

    console.log('Submitting boulder with competitionId:', competitionId);

    onSubmit(boulderData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('boulderName')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('enterBoulderName')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('color')}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-5 gap-2"
                  >
                    {colorOptions.map(color => (
                      <FormItem key={color.value} className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem
                            value={color.value}
                            id={`color-${color.value}`}
                            className="sr-only"
                          />
                        </FormControl>
                        <label
                          htmlFor={`color-${color.value}`}
                          className={`w-8 h-8 rounded-full cursor-pointer border-2 flex items-center justify-center ${field.value === color.value ? 'border-primary' : 'border-transparent'}`}
                          style={{ backgroundColor: color.value }}
                        >
                          {field.value === color.value && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </label>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <FormField
            control={form.control}
            name="maxPoints"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('maxPoints') || 'Max Points'}</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <div className="text-xs text-muted-foreground mt-1">
                  {t('maxPointsHelp') || 'Maximum points for first attempt. Points decrease by 5% per attempt.'}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxZonePoints"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('maxZonePoints') || 'Max Zone Points'}</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <div className="text-xs text-muted-foreground mt-1">
                  {t('maxZonePointsHelp') || 'Points awarded for reaching the zone hold.'}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="bg-muted/50 p-4 rounded-lg mb-6">
          <h3 className="font-medium mb-3">{t('calculatedPoints') || 'Calculated Points'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FormField
              control={form.control}
              name="pointsForFirst"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pointsForFirst')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} readOnly className="bg-background" />
                  </FormControl>
                  <div className="text-xs text-muted-foreground mt-1">{t('firstAttempt') || '1st attempt'}</div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pointsForSecond"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pointsForSecond')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} readOnly className="bg-background" />
                  </FormControl>
                  <div className="text-xs text-muted-foreground mt-1">{t('secondAttempt') || '2nd attempt'}</div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pointsForThird"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pointsForThird')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} readOnly className="bg-background" />
                  </FormControl>
                  <div className="text-xs text-muted-foreground mt-1">{t('thirdAttempt') || '3rd attempt'}</div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pointsForFourth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pointsForFourth')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} readOnly className="bg-background" />
                  </FormControl>
                  <div className="text-xs text-muted-foreground mt-1">{t('fourthAttempt') || '4th attempt'}</div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pointsForFifth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pointsForFifth')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} readOnly className="bg-background" />
                  </FormControl>
                  <div className="text-xs text-muted-foreground mt-1">{t('fifthAttempt') || '5th attempt'}</div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pointsForZone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pointsForZone')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} readOnly className="bg-background" />
                  </FormControl>
                  <div className="text-xs text-muted-foreground mt-1">{t('zonePoints') || 'Zone points'}</div>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('displayOrder')}</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4">
                <div className="space-y-0.5">
                  <FormLabel>{t('activeStatus')}</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    {t('makeBoulderVisible')}
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t('saving') : isEditing ? t('updateBoulder') : t('addBoulder')}
        </Button>
      </form>
    </Form>
  );
};

export default AdminBoulderForm;
