import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is the quality of MCA Fashion clothing?",
    answer: "Our fashion products are made with premium quality materials and crafted with attention to detail. Each item undergoes rigorous quality control to ensure durability and customer satisfaction."
  },
  {
    question: "What is your return policy?",
    answer: "We offer a hassle-free 30-day return policy. If you're not completely satisfied with your purchase, you can return it within 30 days for a full refund. Items must be unused and in their original packaging."
  },
  {
    question: "Do you offer sample sizes?",
    answer: "Yes, we offer sample sizes for select products. Contact our customer service team for more information about available sample sizes and ordering process."
  },
  {
    question: "Is MCA Fashion sustainable?",
    answer: "Yes, we are committed to sustainability. We use eco-friendly materials where possible, implement sustainable manufacturing practices, and continuously work to reduce our environmental impact."
  },
  {
    question: "How should I care for my clothing?",
    answer: "To keep your garments looking their best, always follow the care label. Wash similar colors together and use gentle cycles for delicate fabrics. Prefer cold water when recommended and avoid tumble-drying when possible — air dry flat or hang to preserve shape. For structured or delicate pieces, consider professional dry cleaning. Store clothing in a cool, dry place away from direct sunlight; use padded hangers for coats and jackets and fold knitwear to prevent stretching."
  }
];

const FAQ = () => {
  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about MCA Fashion designer wear
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
              <AccordionTrigger className="text-left hover:text-primary transition-colors py-4">
                <span className="font-semibold">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
