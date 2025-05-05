

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from '@/types';
// Alert imports removed

// Define form schema with stronger password validation
const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Please select your gender.',
  }),
  university: z.string().min(2, { message: 'University is required.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface SignupFormProps {
  onSubmit: (data: Omit<User, 'id'> & { password: string }) => void;
  isLoading?: boolean;
  passwordError?: string;
}

const SignupForm = ({ onSubmit, isLoading = false, passwordError = '' }: SignupFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      gender: 'male' as const,
      university: '',
    },
    mode: 'onChange', // Validate on change
  });

  const handleSubmit = (data: FormValues) => {
    // Trim whitespace from string fields
    const userData: Omit<User, 'id'> & { password: string } = {
      name: data.name.trim(),
      email: data.email.trim(),
      password: data.password,
      gender: data.gender,
      university: data.university,
      totalPoints: 0,
    };

    console.log('Form submitted with data:', { ...userData, password: '***' });
    onSubmit(userData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 w-full max-w-md mx-auto">
        {/* Email verification alert removed */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Create a password (min 6 characters)" {...field} />
              </FormControl>
              <FormMessage />
              {passwordError && <p className="text-sm text-destructive mt-1">{passwordError}</p>}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="university"
          render={({ field }) => (
            <FormItem>
              <FormLabel>University</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="What is your school?" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="UdeM">Université de Montréal</SelectItem>
                  <SelectItem value="McGill">McGill</SelectItem>
                  <SelectItem value="Concordia">Concordia</SelectItem>
                  <SelectItem value="Polytechnique">Polytechnique</SelectItem>
                  <SelectItem value="Université de Laval">Université de Laval</SelectItem>
                  <SelectItem value="Université de Sherbrooke">Université de Sherbrooke</SelectItem>
                  <SelectItem value="Université du Québec">Université du Québec</SelectItem>
                  <SelectItem value="UOttawa">UOttawa</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
    </Form>
  );
};

export default SignupForm;
