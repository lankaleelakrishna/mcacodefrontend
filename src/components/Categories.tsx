import { Sparkles, Flower2, Trees, Wind } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const categories = [
  {
    name: "Floral",
    icon: Flower2,
    count: 8,
    description: "Delicate & romantic",
    color: "from-pink-500/20 to-rose-500/20"
  },
  {
    name: "Woody",
    icon: Trees,
    count: 6,
    description: "Earthy & sophisticated",
    color: "from-amber-500/20 to-orange-500/20"
  },
  {
    name: "Fresh",
    icon: Wind,
    count: 5,
    description: "Clean & invigorating",
    color: "from-cyan-500/20 to-blue-500/20"
  },
  {
    name: "Oriental",
    icon: Sparkles,
    count: 6,
    description: "Rich & exotic",
    color: "from-purple-500/20 to-indigo-500/20"
  }
];

const Categories = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Shop by Fragrance Type</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover your perfect scent family
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.name}
                className="group cursor-pointer hover:shadow-elegant transition-smooth overflow-hidden"
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center group-hover:scale-110 transition-smooth`}>
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold mb-2">{category.name}</h3>
                  <p className="text-sm text-muted-foreground mb-1">{category.description}</p>
                  <p className="text-xs text-muted-foreground">{category.count} fragrances</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
