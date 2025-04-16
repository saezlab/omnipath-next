import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Interaction {
  source: string;
  target: string;
  type: string;
}

interface Annotations {
  location: string[];
  function: string[];
  disease: string[];
  pathway: string[];
  totalCount: number;
}

type ToolResult = {
  interactions?: Interaction[];
  location?: string[];
  function?: string[];
  disease?: string[];
  pathway?: string[];
  totalCount?: number;
};

interface CustomToolInvocation {
  toolName: string;
  args: { query: string };
  state: string;
  result?: ToolResult;
}

const InteractionsTable = ({ interactions }: { interactions: Interaction[] }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Source</TableHead>
          <TableHead>Target</TableHead>
          <TableHead>Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {interactions.map((interaction, index) => (
          <TableRow key={index}>
            <TableCell>{interaction.source}</TableCell>
            <TableCell>{interaction.target}</TableCell>
            <TableCell>
              <Badge variant="outline">{interaction.type}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const AnnotationsDisplay = ({ annotations }: { annotations: Annotations }) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {annotations.location.map((loc, index) => (
              <Badge key={index} variant="secondary">
                {loc}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Function</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {annotations.function.map((func, index) => (
              <Badge key={index} variant="secondary">
                {func}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disease Associations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {annotations.disease.map((disease, index) => (
              <Badge key={index} variant="secondary">
                {disease}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pathways</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {annotations.pathway.map((pathway, index) => (
              <Badge key={index} variant="secondary">
                {pathway}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        Total annotations: {annotations.totalCount}
      </div>
    </div>
  );
};

export const ToolResponse = ({ toolInvocation }: { toolInvocation: CustomToolInvocation }) => {
  const { toolName, result } = toolInvocation;

  if (!result) return null;

  switch (toolName) {
    case "searchInteractions":
      return result.interactions ? <InteractionsTable interactions={result.interactions} /> : null;
    case "getAnnotations":
      return result.location ? <AnnotationsDisplay annotations={result as Annotations} /> : null;
    default:
      return null;
  }
}; 