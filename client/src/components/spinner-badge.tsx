import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

export function SpinnerBadge() {
    return (
        <Badge variant="secondary">
            <Spinner data-icon="inline-start" />
            Updating
        </Badge>
    );
}
