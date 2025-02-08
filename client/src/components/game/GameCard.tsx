import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { type Move } from "@/lib/gameState";

type GameCardProps = {
  move: Move;
  selected?: boolean;
  disabled?: boolean;
  onSelect: (move: Move) => void;
};

const moveImages = {
  rock: "https://images.unsplash.com/photo-1519972064555-542444e71b54",
  paper: "https://images.unsplash.com/photo-1520004434532-668416a08753",
  scissors: "https://images.unsplash.com/photo-1532153259564-a5f24f261f51"
};

export function GameCard({ move, selected, disabled, onSelect }: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      animate={{
        scale: selected ? 1.1 : 1,
        opacity: disabled ? 0.5 : 1
      }}
    >
      <Card
        className={`cursor-pointer overflow-hidden ${selected ? "ring-2 ring-primary" : ""}`}
        onClick={() => !disabled && onSelect(move)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-0 relative aspect-square">
          <img
            src={moveImages[move]}
            alt={move}
            className="w-full h-full object-cover"
          />
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/50 to-transparent
              flex items-end justify-center pb-4
              transition-opacity duration-200
              ${isHovered ? "opacity-100" : "opacity-0"}`}
          >
            <span className="text-white font-bold capitalize">{move}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
