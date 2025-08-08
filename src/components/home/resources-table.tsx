"use client";

import React, { useState, useMemo } from "react";
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
import { Search, ChevronUp, ChevronDown, Download, FileText, Globe, ChevronRight } from "lucide-react";
import {
  getAllResources,
  getResourceStats,
  type ResourceData,
} from "@/utils/database-data";

type SortField = "name" | "categories" | "recordCount" | "license" | "maintenance";
type SortDirection = "asc" | "desc";

export function ResourcesTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [licenseFilter, setLicenseFilter] = useState<string>("all");
  const [maintenanceFilter, setMaintenanceFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("recordCount");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const resources = useMemo(() => getAllResources(), []);
  const stats = useMemo(() => getResourceStats(), []);

  const filteredAndSortedResources = useMemo(() => {
    const filtered = resources.filter((resource) => {
      const matchesSearch =
        searchTerm === "" ||
        resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.originalNames.some(name => name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        resource.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase())) ||
        resource.subcategories.some(sub => sub.toLowerCase().includes(searchTerm.toLowerCase())) ||
        resource.licenseDetails?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.licenseDetails?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.recommend?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.descriptions?.some(desc => desc.toLowerCase().includes(searchTerm.toLowerCase())) ||
        resource.emails?.some(email => email[0].toLowerCase().includes(searchTerm.toLowerCase()) || email[1].toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        categoryFilter === "all" || resource.categories.includes(categoryFilter);

      const matchesLicense =
        licenseFilter === "all" || resource.license === licenseFilter;

      const matchesMaintenance =
        maintenanceFilter === "all" || resource.maintenance === maintenanceFilter;

      return matchesSearch && matchesCategory && matchesLicense && matchesMaintenance;
    });

    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortField === "categories") {
        aValue = a.categories.join(", ");
        bValue = b.categories.join(", ");
      } else if (sortField === "recordCount") {
        aValue = Number(a.recordCount);
        bValue = Number(b.recordCount);
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
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

  const toggleRowExpansion = (resourceName: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(resourceName)) {
      newExpanded.delete(resourceName);
    } else {
      newExpanded.add(resourceName);
    }
    setExpandedRows(newExpanded);
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
      "frequent updates": "bg-green-100 text-green-800 border-green-200",
      "infrequent updates": "bg-orange-100 text-orange-800 border-orange-200",
      "no updates": "bg-red-100 text-red-800 border-red-200",
      unknown: "bg-gray-100 text-gray-800 border-gray-200",
    };

    const labels = {
      "frequent updates": "Frequent Updates",
      "infrequent updates": "Infrequent Updates",
      "no updates": "No Updates",
      unknown: "Unknown",
    };

    return (
      <Badge variant="outline" className={colors[maintenance]}>
        {labels[maintenance]}
      </Badge>
    );
  };

  const getLicenseBadge = (resource: ResourceData) => {
    // Use detailed license info if available, otherwise fall back to category
    const licenseDetails = resource.licenseDetails;
    const license = resource.license;
    
    if (!licenseDetails && license === "unknown") {
      return <span className="text-muted-foreground">—</span>;
    }

    const colors = {
      academic_nonprofit: "bg-blue-100 text-blue-800 border-blue-200",
      commercial: "bg-green-100 text-green-800 border-green-200",
    };

    const fallbackLabels = {
      academic_nonprofit: "Academic/Non-profit",
      commercial: "Commercial",
    };

    if (licenseDetails) {
      // Show detailed license info
      const badgeContent = (
        <div className="flex flex-col max-w-[200px]" title={licenseDetails.fullName}>
          <span className="font-medium truncate">{licenseDetails.name}</span>
          <span className="text-xs opacity-75 truncate">{licenseDetails.fullName}</span>
        </div>
      );

      if (licenseDetails.url) {
        return (
          <a
            href={licenseDetails.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <Badge variant="outline" className={`${colors[license as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"} cursor-pointer`}>
              {badgeContent}
            </Badge>
          </a>
        );
      } else {
        return (
          <Badge variant="outline" className={colors[license as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"}>
            {badgeContent}
          </Badge>
        );
      }
    } else {
      // Fall back to simple category badge
      return (
        <Badge variant="outline" className={colors[license as keyof typeof colors]}>
          {fallbackLabels[license as keyof typeof fallbackLabels]}
        </Badge>
      );
    }
  };

  const getCategoryBadges = (categories: string[]) => {
    const colors: Record<string, string> = {
      Interactions: "bg-blue-100 text-blue-800 border-blue-200",
      Annotations: "bg-orange-100 text-orange-800 border-orange-200",
      "Enzyme-Substrate": "bg-red-100 text-red-800 border-red-200",
      Complexes: "bg-green-100 text-green-800 border-green-200",
      Intercellular: "bg-purple-100 text-purple-800 border-purple-200",
    };

    return categories.map((category, idx) => (
      <Badge key={idx} variant="outline" className={colors[category] || "bg-gray-100 text-gray-800 border-gray-200"}>
        {category}
      </Badge>
    ));
  };


  const getResourceName = (resource: ResourceData) => {
    return <span className="font-medium">{resource.name}</span>;
  };

  const exportToCSV = () => {
    const headers = [
      "Resource Name", 
      "Categories", 
      "License Name", 
      "License Full Name", 
      "License URL",
      "Maintenance", 
      "Records", 
      "Articles", 
      "Webpages", 
      "PubMeds", 
      "Contacts"
    ];
    const rows = filteredAndSortedResources.map(resource => [
      resource.name,
      resource.categories.join("; "),
      resource.licenseDetails?.name || (resource.license === "academic_nonprofit" ? "Academic/Non-profit" : resource.license === "commercial" ? "Commercial" : "Unknown"),
      resource.licenseDetails?.fullName || "",
      resource.licenseDetails?.url || "",
      resource.maintenance === "frequent updates" ? "Frequent Updates" :
        resource.maintenance === "infrequent updates" ? "Infrequent Updates" :
        resource.maintenance === "no updates" ? "No Updates" : "Unknown",
      resource.recordCount.toString(),
      resource.urls?.articles?.join("; ") || "",
      resource.urls?.webpages?.join("; ") || "",
      resource.pubmeds?.join("; ") || "",
      resource.emails?.map(email => `${email[1]} (${email[0]})`).join("; ") || ""
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "omnipath-resources.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Database Resources Overview</CardTitle>
            <CardDescription>
              Comprehensive listing of all {stats.total} resources with {stats.totalRecords.toLocaleString()} total records
            </CardDescription>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
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
                <SelectItem value="frequent updates">Frequent Updates</SelectItem>
                <SelectItem value="infrequent updates">Infrequent Updates</SelectItem>
                <SelectItem value="no updates">No Updates</SelectItem>
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
                      onClick={() => handleSort("categories")}
                    >
                      <div className="flex items-center gap-1">
                        Categories
                        <SortIcon field="categories" />
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
                {filteredAndSortedResources.map((resource, index) => {
                  const isExpanded = expandedRows.has(resource.name);
                  const hasDetails = resource.descriptions || resource.recommend || resource.emails || 
                    (resource.urls?.articles && resource.urls.articles.length > 0) ||
                    (resource.urls?.webpages && resource.urls.webpages.length > 0) ||
                    (resource.pubmeds && resource.pubmeds.length > 0);
                  
                  return (
                    <React.Fragment key={`${resource.name}-${index}`}>
                      <TableRow>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {hasDetails && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => toggleRowExpansion(resource.name)}
                              >
                                <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              </Button>
                            )}
                            <div className={!hasDetails ? 'ml-8' : ''}>
                              {getResourceName(resource)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[250px]">
                          <div className="flex flex-wrap gap-1" title={resource.categories.join(", ")}>
                            {getCategoryBadges(resource.categories)}
                          </div>
                        </TableCell>
                        <TableCell>{getLicenseBadge(resource)}</TableCell>
                        <TableCell>{getMaintenanceBadge(resource.maintenance)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {resource.recordCount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                      {isExpanded && hasDetails && (
                        <TableRow>
                          <TableCell colSpan={5} className="bg-gray-50 border-t-0 p-0">
                            <div className="px-6 py-4 space-y-4 max-w-none">
                              {resource.recommend && (
                                <div className="max-w-full">
                                  <h4 className="font-medium text-sm text-gray-700 mb-2">Recommendation</h4>
                                  <p className="text-sm text-gray-600 leading-relaxed break-words">
                                    {resource.recommend}
                                  </p>
                                </div>
                              )}
                              
                              {resource.descriptions && resource.descriptions.length > 0 && (
                                <div className="max-w-full">
                                  <h4 className="font-medium text-sm text-gray-700 mb-2">Descriptions</h4>
                                  <div className="space-y-3">
                                    {resource.descriptions.map((desc, idx) => (
                                      <p key={idx} className="text-sm text-gray-600 leading-relaxed break-words whitespace-pre-wrap">
                                        {desc}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {resource.urls?.articles && resource.urls.articles.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-sm text-gray-700 mb-2">Articles</h4>
                                    <div className="space-y-1">
                                      {resource.urls.articles.map((url, idx) => (
                                        <a
                                          key={idx}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors break-all"
                                        >
                                          <FileText className="w-4 h-4 flex-shrink-0" />
                                          <span className="flex-1">Article {idx + 1}</span>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {resource.urls?.webpages && resource.urls.webpages.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-sm text-gray-700 mb-2">Webpages</h4>
                                    <div className="space-y-1">
                                      {resource.urls.webpages.map((url, idx) => (
                                        <a
                                          key={idx}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-sm text-green-600 hover:text-green-800 hover:underline transition-colors break-all"
                                        >
                                          <Globe className="w-4 h-4 flex-shrink-0" />
                                          <span className="flex-1">Website {idx + 1}</span>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {resource.pubmeds && resource.pubmeds.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-sm text-gray-700 mb-2">PubMed References</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {resource.pubmeds.map((pmid, idx) => (
                                        <a
                                          key={idx}
                                          href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-purple-600 hover:text-purple-800 hover:underline transition-colors"
                                        >
                                          PMID: {pmid}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {resource.emails && resource.emails.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-sm text-gray-700 mb-2">Contact</h4>
                                    <div className="space-y-1">
                                      {resource.emails.map((email, idx) => (
                                        <a
                                          key={idx}
                                          href={`mailto:${email[0]}`}
                                          className="block text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                                        >
                                          {email[1]} ({email[0]})
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
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
                    <span className="text-muted-foreground">No License:</span>
                    <span className="font-medium">{stats.byLicense.no_license || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Composite:</span>
                    <span className="font-medium">{stats.byLicense.composite || 0}</span>
                  </div>
                  {stats.byLicense.unknown > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unknown:</span>
                      <span className="font-medium">{stats.byLicense.unknown}</span>
                    </div>
                  )}
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
                    <span className="font-medium">{stats.byMaintenance["frequent updates"] || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Infrequent:</span>
                    <span className="font-medium">{stats.byMaintenance["infrequent updates"] || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">No Updates:</span>
                    <span className="font-medium">{stats.byMaintenance["no updates"] || 0}</span>
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