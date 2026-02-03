import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  fallbackPath?: string;
  className?: string;
}

const BackButton = ({ fallbackPath = "/", className = "" }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`gap-2 text-muted-foreground hover:text-foreground ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );
};

export default BackButton;
