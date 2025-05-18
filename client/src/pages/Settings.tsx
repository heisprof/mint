import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const settingSchema = z.object({
  value: z.string()
});

type Setting = {
  key: string;
  value: string;
};

function SettingForm({ settingKey, title, description }: { settingKey: string, title: string, description: string }) {
  const { toast } = useToast();
  
  const { data, isLoading } = useQuery<Setting>({
    queryKey: [`/api/settings/${settingKey}`]
  });

  const form = useForm({
    resolver: zodResolver(settingSchema),
    defaultValues: {
      value: ""
    },
    values: {
      value: data?.value || ""
    }
  });

  const mutation = useMutation({
    mutationFn: async (formData: { value: string }) => {
      const response = await fetch(`/api/settings/${settingKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update setting');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/settings/${settingKey}`] });
      toast({
        title: "Setting Updated",
        description: "Your setting has been saved successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save setting",
        variant: "destructive"
      });
    }
  });

  function onSubmit(data: z.infer<typeof settingSchema>) {
    mutation.mutate(data);
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  const { data: maintenanceSetting } = useQuery<Setting>({
    queryKey: ['/api/settings/maintenance_mode']
  });

  // Update state when data is loaded
  useEffect(() => {
    if (maintenanceSetting?.value === 'true') {
      setMaintenanceMode(true);
    }
  }, [maintenanceSetting]);
  
  const toggleMaintenanceMode = async () => {
    try {
      const response = await fetch('/api/settings/maintenance_mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: maintenanceMode ? 'false' : 'true' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle maintenance mode');
      }
      
      setMaintenanceMode(!maintenanceMode);
      queryClient.invalidateQueries({ queryKey: ['/api/settings/maintenance_mode'] });
      
      toast({
        title: "Maintenance Mode Updated",
        description: `Maintenance mode is now ${!maintenanceMode ? 'enabled' : 'disabled'}.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to toggle maintenance mode",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">System Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Mode</CardTitle>
            <CardDescription>
              When enabled, monitoring tasks will be paused and users will see a maintenance message.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                checked={maintenanceMode}
                onCheckedChange={toggleMaintenanceMode}
                id="maintenance-mode"
              />
              <label htmlFor="maintenance-mode">
                {maintenanceMode ? "Enabled" : "Disabled"}
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-2xl font-bold mb-4">Global Settings</h2>
      <Separator className="mb-6" />
      
      <SettingForm 
        settingKey="monitoring_interval" 
        title="Monitoring Interval (minutes)" 
        description="How often the system should check databases and filesystems" 
      />
      
      <SettingForm 
        settingKey="alert_retention_days" 
        title="Alert Retention (days)" 
        description="Number of days to keep alert history before purging" 
      />
      
      <SettingForm 
        settingKey="smtp_from_email" 
        title="Default From Email" 
        description="Email address used when sending alert notifications" 
      />
    </div>
  );
}