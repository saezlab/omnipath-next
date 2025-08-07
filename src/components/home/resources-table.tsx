"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ChevronUp, ChevronDown, Filter } from "lucide-react";
import {
  getAllResources,
  getResourceStats,
  maintenanceColors,
  licenseColors,
  type ResourceData,
} from "@/utils/resources-table-data";

type SortField = "name" | "category" | "subcategory" | "recordCount" | "license" | "maintenance";
type SortDirection = "asc" | "desc";

export function ResourcesTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [licenseFilter, setLicenseFilter] = useState<string>("all");
  const [maintenanceFilter, setMaintenanceFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("recordCount");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const resources = useMemo(() => getAllResources(), []);
  const stats = useMemo(() => getResourceStats(), []);

  const filteredAndSortedResources = useMemo(() => {
    let filtered = resources.filter((resource) => {
      const matchesSearch =
        searchTerm === "" ||
        resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.subcategory.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || resource.category === categoryFilter;

      const matchesLicense =
        licenseFilter === "all" || resource.license === licenseFilter;

      const matchesMaintenance =
        maintenanceFilter === "all" || resource.maintenance === maintenanceFilter;

      return matchesSearch && matchesCategory && matchesLicense && matchesMaintenance;
    });

    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === "recordCount") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [resources, searchTerm, categoryFilter, licenseFilter, maintenanceFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <div className="w-4 h-4" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const getMaintenanceBadge = (maintenance: ResourceData["maintenance"]) => {
    const colors = {
      frequent: "bg-green-100 text-green-800 border-green-200",
      infrequent: "bg-orange-100 text-orange-800 border-orange-200",
      one_time_paper: "bg-red-100 text-red-800 border-red-200",
      discontinued: "bg-purple-100 text-purple-800 border-purple-200",
      unknown: "bg-gray-100 text-gray-800 border-gray-200",
    };

    const labels = {
      frequent: "Frequent Updates",
      infrequent: "Infrequent Updates",
      one_time_paper: "One-time Paper",
      discontinued: "Discontinued",
      unknown: "Unknown",
    };

    return (
      <Badge variant="outline" className={colors[maintenance]}>
        {labels[maintenance]}
      </Badge>
    );
  };

  const getLicenseBadge = (license: ResourceData["license"]) => {
    const colors = {
      academic_nonprofit: "bg-blue-100 text-blue-800 border-blue-200",
      commercial: "bg-green-100 text-green-800 border-green-200",
      unknown: "bg-gray-100 text-gray-800 border-gray-200",
    };

    const labels = {
      academic_nonprofit: "Academic/Non-profit",
      commercial: "Commercial",
      unknown: "Unknown",
    };

    return (
      <Badge variant="outline" className={colors[license]}>
        {labels[license]}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      Interactions: "bg-blue-100 text-blue-800 border-blue-200",
      Annotations: "bg-orange-100 text-orange-800 border-orange-200",
      "Enzyme-Substrate": "bg-red-100 text-red-800 border-red-200",
      Complexes: "bg-green-100 text-green-800 border-green-200",
      Intercellular: "bg-purple-100 text-purple-800 border-purple-200",
    };

    return (
      <Badge variant="outline" className={colors[category] || "bg-gray-100 text-gray-800 border-gray-200"}>
        {category}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Database Resources Overview</CardTitle>
        <CardDescription>
          Comprehensive listing of all {stats.total} resources with {stats.totalRecords.toLocaleString()} total records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Interactions">Interactions</SelectItem>
                <SelectItem value="Annotations">Annotations</SelectItem>
                <SelectItem value="Enzyme-Substrate">Enzyme-Substrate</SelectItem>
                <SelectItem value="Complexes">Complexes</SelectItem>
                <SelectItem value="Intercellular">Intercellular</SelectItem>
              </SelectContent>
            </Select>
            <Select value={licenseFilter} onValueChange={setLicenseFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="License" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Licenses</SelectItem>
                <SelectItem value="academic_nonprofit">Academic/Non-profit</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
            <Select value={maintenanceFilter} onValueChange={setMaintenanceFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Maintenance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="frequent">Frequent Updates</SelectItem>
                <SelectItem value="infrequent">Infrequent Updates</SelectItem>
                <SelectItem value="one_time_paper">One-time Paper</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredAndSortedResources.length} of {resources.length} resources
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Resource Name
                        <SortIcon field="name" />
                      </div>
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent"
                      onClick={() => handleSort("category")}
                    >
                      <div className="flex items-center gap-1">
                        Category
                        <SortIcon field="category" />
                      </div>
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent"
                      onClick={() => handleSort("subcategory")}
                    >
                      <div className="flex items-center gap-1">
                        Subcategory
                        <SortIcon field="subcategory" />
                      </div>
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent"
                      onClick={() => handleSort("license")}
                    >
                      <div className="flex items-center gap-1">
                        License Type
                        <SortIcon field="license" />
                      </div>
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent"
                      onClick={() => handleSort("maintenance")}
                    >
                      <div className="flex items-center gap-1">
                        Maintenance
                        <SortIcon field="maintenance" />
                      </div>
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent ml-auto"
                      onClick={() => handleSort("recordCount")}
                    >
                      <div className="flex items-center gap-1">
                        Records
                        <SortIcon field="recordCount" />
                      </div>
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedResources.map((resource, index) => (
                  <TableRow key={`${resource.name}-${resource.category}-${index}`}>
                    <TableCell className="font-medium">
                      {resource.name}
                      {resource.originalName !== resource.name && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({resource.originalName})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{getCategoryBadge(resource.category)}</TableCell>
                    <TableCell>
                      {resource.subcategory || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getLicenseBadge(resource.license)}</TableCell>
                    <TableCell>{getMaintenanceBadge(resource.maintenance)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {resource.recordCount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">By Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  {Object.entries(stats.byCategory).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">By License</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Academic/Non-profit:</span>
                    <span className="font-medium">{stats.byLicense.academic_nonprofit || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commercial:</span>
                    <span className="font-medium">{stats.byLicense.commercial || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unknown:</span>
                    <span className="font-medium">{stats.byLicense.unknown || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">By Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frequent:</span>
                    <span className="font-medium">{stats.byMaintenance.frequent || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Infrequent:</span>
                    <span className="font-medium">{stats.byMaintenance.infrequent || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">One-time:</span>
                    <span className="font-medium">{stats.byMaintenance.one_time_paper || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discontinued:</span>
                    <span className="font-medium">{stats.byMaintenance.discontinued || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}