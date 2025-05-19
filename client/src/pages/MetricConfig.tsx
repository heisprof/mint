import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Database } from "lucide-react";

type MetricDefinition = {
  id: number;
  name: string;
  displayName: string;
  description: string;
  category: string;
  applicableTo: string;
  defaultEnabled: boolean;
  unit: string;
};

type MonitoringTemplate = {
  id: number;
  name: string;
  description: string;
  createdBy: number;
};

type DatabaseWithType = {
  id: number;
  name: string;
  type: {
    id: number;
    name: string;
  };
};

type DatabaseMetric = {
  id: number;
  databaseId: number;
  metricId: number;
  enabled: boolean;
};

// Schema for creating monitoring templates
const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
});

// Schema for applying a template to databases
const applyTemplateSchema = z.object({
  templateId: z.string().min(1, "Template is required"),
  databaseIds: z.array(z.number()).min(1, "At least one database must be selected"),
});

// Component for managing metric templates
function TemplateManager() {
  const { toast } = useToast();
  const [selectedMetrics, setSelectedMetrics] = useState<number[]>([]);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  // Fetch all available metrics
  const { data: metrics } = useQuery<MetricDefinition[]>({
    queryKey: ['/api/metric-definitions'],
  });

  // Fetch all templates
  const { data: templates } = useQuery<MonitoringTemplate[]>({
    queryKey: ['/api/monitoring-templates'],
  });

  // Form for creating a new template
  const form = useForm<z.infer<typeof createTemplateSchema>>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Mutation for creating a new template
  const createTemplateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createTemplateSchema>) => {
      const response = await fetch('/api/monitoring-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          metricIds: selectedMetrics,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create template');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/monitoring-templates'] });
      toast({
        title: "Template Created",
        description: "The monitoring template has been created successfully",
      });
      setIsCreatingTemplate(false);
      form.reset();
      setSelectedMetrics([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create template",
        variant: "destructive",
      });
    },
  });

  // Toggle a metric selection
  const toggleMetric = (metricId: number) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  // Handle template creation form submission
  const onSubmit = (data: z.infer<typeof createTemplateSchema>) => {
    if (selectedMetrics.length === 0) {
      toast({
        title: "No Metrics Selected",
        description: "Please select at least one metric for the template",
        variant: "destructive",
      });
      return;
    }

    createTemplateMutation.mutate(data);
  };

  // Metrics by category for the UI
  const metricsByCategory = metrics ? 
    metrics.reduce<Record<string, MetricDefinition[]>>((acc, metric) => {
      if (!acc[metric.category]) {
        acc[metric.category] = [];
      }
      acc[metric.category].push(metric);
      return acc;
    }, {}) : {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitoring Templates</CardTitle>
        <CardDescription>
          Create and manage templates for database monitoring
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex justify-between">
          <h3 className="text-lg font-semibold">Existing Templates</h3>
          <Button onClick={() => setIsCreatingTemplate(true)}>Create New Template</Button>
        </div>

        {templates && templates.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map(template => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>{template.description}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">View Details</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No templates created yet. Create a template to get started.
          </div>
        )}

        <Dialog open={isCreatingTemplate} onOpenChange={setIsCreatingTemplate}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create Monitoring Template</DialogTitle>
              <DialogDescription>
                Select metrics to include in this monitoring template
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. MySQL Production Servers" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Description of this template" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Select Metrics</h3>
                  {Object.keys(metricsByCategory).length > 0 ? (
                    <Accordion type="multiple" className="w-full">
                      {Object.entries(metricsByCategory).map(([category, categoryMetrics]) => (
                        <AccordionItem key={category} value={category}>
                          <AccordionTrigger className="text-md font-medium capitalize">
                            {category} Metrics
                            <span className="ml-2 text-xs text-blue-500">
                              ({categoryMetrics.length} available)
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              {categoryMetrics.map(metric => (
                                <div key={metric.id} className="flex items-start space-x-2 p-2 hover:bg-blue-50 rounded">
                                  <Checkbox 
                                    id={`metric-${metric.id}`} 
                                    checked={selectedMetrics.includes(metric.id)}
                                    onCheckedChange={() => toggleMetric(metric.id)}
                                  />
                                  <div className="grid gap-1.5">
                                    <Label
                                      htmlFor={`metric-${metric.id}`}
                                      className="font-medium"
                                    >
                                      {metric.displayName}
                                      {metric.applicableTo !== 'both' && (
                                        <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-800 capitalize">
                                          {metric.applicableTo} only
                                        </span>
                                      )}
                                    </Label>
                                    <p className="text-sm text-gray-500">{metric.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      Loading available metrics...
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline" 
                    onClick={() => setIsCreatingTemplate(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createTemplateMutation.isPending}
                  >
                    {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Component for applying templates to databases
function ApplyTemplates() {
  const { toast } = useToast();
  const [selectedDatabases, setSelectedDatabases] = useState<number[]>([]);

  // Fetch all templates
  const { data: templates } = useQuery<MonitoringTemplate[]>({
    queryKey: ['/api/monitoring-templates'],
  });

  // Fetch all databases
  const { data: databases } = useQuery<DatabaseWithType[]>({
    queryKey: ['/api/databases'],
  });

  // Form for applying templates
  const form = useForm<z.infer<typeof applyTemplateSchema>>({
    resolver: zodResolver(applyTemplateSchema),
    defaultValues: {
      templateId: "",
      databaseIds: [],
    },
  });

  // Update form when selected databases change
  useEffect(() => {
    form.setValue('databaseIds', selectedDatabases);
  }, [selectedDatabases, form]);

  // Mutation for applying a template to databases
  const applyTemplateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof applyTemplateSchema>) => {
      const response = await fetch('/api/apply-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to apply template');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Applied",
        description: "The template has been applied to the selected databases",
      });
      form.reset();
      setSelectedDatabases([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to apply template",
        variant: "destructive",
      });
    },
  });

  // Toggle a database selection
  const toggleDatabase = (databaseId: number) => {
    setSelectedDatabases(prev => 
      prev.includes(databaseId)
        ? prev.filter(id => id !== databaseId)
        : [...prev, databaseId]
    );
  };

  // Handle apply template form submission
  const onSubmit = (data: z.infer<typeof applyTemplateSchema>) => {
    applyTemplateMutation.mutate(data);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Apply Templates</CardTitle>
        <CardDescription>
          Apply monitoring templates to one or more databases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Template</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a monitoring template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templates?.map(template => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormField
                control={form.control}
                name="databaseIds"
                render={() => (
                  <FormItem>
                    <FormLabel>Select Databases</FormLabel>
                    <FormDescription>
                      Choose the databases to apply this template to
                    </FormDescription>
                    <div className="border rounded-md p-4 mt-2">
                      {databases?.map(database => (
                        <div key={database.id} className="flex items-center space-x-2 py-2">
                          <Checkbox 
                            id={`db-${database.id}`} 
                            checked={selectedDatabases.includes(database.id)}
                            onCheckedChange={() => toggleDatabase(database.id)}
                          />
                          <Label htmlFor={`db-${database.id}`} className="font-medium">
                            {database.name}
                            <span className="ml-2 text-sm text-gray-500">
                              ({database.type.name})
                            </span>
                          </Label>
                        </div>
                      ))}
                      {!databases?.length && (
                        <div className="text-center py-4 text-gray-500">
                          No databases available
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit"
                disabled={applyTemplateMutation.isPending || !form.formState.isValid}
              >
                {applyTemplateMutation.isPending ? "Applying..." : "Apply Template"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Component for customizing metrics for individual databases
function CustomizeMetrics() {
  const { toast } = useToast();
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [databaseMetrics, setDatabaseMetrics] = useState<DatabaseMetric[]>([]);

  // Fetch all databases
  const { data: databases } = useQuery<DatabaseWithType[]>({
    queryKey: ['/api/databases'],
  });

  // Fetch all available metrics
  const { data: metrics } = useQuery<MetricDefinition[]>({
    queryKey: ['/api/metric-definitions'],
  });

  // Fetch metrics for a specific database
  const { data: dbMetrics, refetch } = useQuery<DatabaseMetric[]>({
    queryKey: ['/api/database-metrics', selectedDatabase],
    enabled: !!selectedDatabase,
  });

  // Update state when database metrics are loaded
  useEffect(() => {
    if (dbMetrics) {
      setDatabaseMetrics(dbMetrics);
    }
  }, [dbMetrics]);

  // Mutation for saving custom metrics
  const saveMetricsMutation = useMutation({
    mutationFn: async (metrics: DatabaseMetric[]) => {
      const response = await fetch(`/api/databases/${selectedDatabase}/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metrics }),
      });

      if (!response.ok) {
        throw new Error('Failed to save metrics configuration');
      }

      return response.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Metrics Saved",
        description: "Database metrics configuration has been saved",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save metrics",
        variant: "destructive",
      });
    },
  });

  // Handle database selection
  const handleDatabaseChange = (databaseId: string) => {
    setSelectedDatabase(databaseId);
  };

  // Toggle a metric for the selected database
  const toggleMetric = (metricId: number) => {
    setDatabaseMetrics(prev => {
      const existing = prev.find(m => m.metricId === metricId);
      
      if (existing) {
        // Toggle existing metric
        return prev.map(m => 
          m.metricId === metricId 
            ? { ...m, enabled: !m.enabled }
            : m
        );
      } else {
        // Add new metric configuration
        return [
          ...prev,
          {
            id: 0, // Will be set on server
            databaseId: parseInt(selectedDatabase),
            metricId,
            enabled: true
          }
        ];
      }
    });
  };

  // Check if a metric is enabled
  const isMetricEnabled = (metricId: number) => {
    const metric = databaseMetrics.find(m => m.metricId === metricId);
    return metric ? metric.enabled : false;
  };

  // Metrics by category for the UI
  const metricsByCategory = metrics ? 
    metrics.reduce<Record<string, MetricDefinition[]>>((acc, metric) => {
      if (!acc[metric.category]) {
        acc[metric.category] = [];
      }
      acc[metric.category].push(metric);
      return acc;
    }, {}) : {};

  // Save metrics configuration
  const saveMetrics = () => {
    saveMetricsMutation.mutate(databaseMetrics);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Customize Database Metrics</CardTitle>
        <CardDescription>
          Configure specific metrics to monitor for each database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Label htmlFor="select-database">Select Database</Label>
          <Select onValueChange={handleDatabaseChange} value={selectedDatabase}>
            <SelectTrigger id="select-database" className="mt-1">
              <SelectValue placeholder="Choose a database to configure" />
            </SelectTrigger>
            <SelectContent>
              {databases?.map(database => (
                <SelectItem key={database.id} value={database.id.toString()}>
                  {database.name} ({database.type.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedDatabase ? (
          <>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Configure Metrics
                {databases?.find(db => db.id.toString() === selectedDatabase)?.name && (
                  <span className="text-sm font-normal ml-2 text-gray-500">
                    for {databases.find(db => db.id.toString() === selectedDatabase)?.name}
                  </span>
                )}
              </h3>
              <Button 
                onClick={saveMetrics}
                disabled={saveMetricsMutation.isPending}
              >
                {saveMetricsMutation.isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </div>

            {Object.keys(metricsByCategory).length > 0 ? (
              <Accordion type="multiple" className="w-full">
                {Object.entries(metricsByCategory).map(([category, categoryMetrics]) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="text-md font-medium capitalize">
                      {category} Metrics
                      <span className="ml-2 text-xs text-blue-500">
                        ({categoryMetrics.length} available)
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {categoryMetrics.map(metric => (
                          <div key={metric.id} className="flex items-start space-x-2 p-2 hover:bg-blue-50 rounded">
                            <Checkbox 
                              id={`db-metric-${metric.id}`} 
                              checked={isMetricEnabled(metric.id)}
                              onCheckedChange={() => toggleMetric(metric.id)}
                            />
                            <div className="grid gap-1.5">
                              <Label
                                htmlFor={`db-metric-${metric.id}`}
                                className="font-medium"
                              >
                                {metric.displayName}
                                {metric.applicableTo !== 'both' && (
                                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-800 capitalize">
                                    {metric.applicableTo} only
                                  </span>
                                )}
                                <span className="ml-2 text-xs text-gray-500">
                                  ({metric.unit})
                                </span>
                              </Label>
                              <p className="text-sm text-gray-500">{metric.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-6 text-gray-500">
                Loading available metrics...
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No Database Selected</h3>
            <p className="mt-1">Select a database to configure its monitoring metrics</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MetricConfig() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Metrics Configuration</h1>
      
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="templates">Monitoring Templates</TabsTrigger>
          <TabsTrigger value="apply">Apply Templates</TabsTrigger>
          <TabsTrigger value="customize">Customize Metrics</TabsTrigger>
        </TabsList>
        <TabsContent value="templates">
          <TemplateManager />
        </TabsContent>
        <TabsContent value="apply">
          <ApplyTemplates />
        </TabsContent>
        <TabsContent value="customize">
          <CustomizeMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
}