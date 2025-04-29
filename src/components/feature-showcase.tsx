import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronDown,
  GraduationCap,
  Home,
  Image,
  Tag,
} from 'lucide-react';
import booking from '@/public/assets/features/booking.webp';
import gallery from '@/public/assets/features/gallery.webp';
import home from '@/public/assets/features/home.webp';
import offers from '@/public/assets/features/offers.webp';
import schedule from '@/public/assets/features/schedule.webp';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

// Define the feature buttons with their icons and details
const featureButtons = [
  {
    id: 'home',
    icon: Home,
    label: 'Home',
    title: 'Home',
    imageSrc: home,
    description: [
      'Your home page will show you a quick overview of your booking, as well as navigation to other areas of the app.',
      "You will also have access to a handy to-do list, which you will be able to use to keep track of your graduation day so you don't miss out on anything!",
      'A slider with blog posts will be displayed at the bottom of your homepage, including useful tips for your graduation day!',
    ],
  },
  {
    id: 'booking',
    icon: GraduationCap,
    label: 'Your booking',
    title: 'Your Booking',
    imageSrc: booking,
    description: [
      'Your booking page will show you your full booking, including the details of your gown hire and ceremony.',
      'You will also see a QR code, which contains the details of your booking.',
      'A member of our registration team will scan this QR code on your graduation day to link your details to the GradTag inside your gown.',
    ],
  },
  {
    id: 'schedule',
    icon: Calendar,
    label: 'Schedule',
    title: 'Schedule',
    imageSrc: schedule,
    description: [
      'The schedule page will display the timings of your ceremony day, including the following details:',
      '• Gown collection and return times',
      '• Photography opening and closing times (When managed by Graduation Attire)',
      '• Ceremony start and finish times.',
    ],
  },
  {
    id: 'gallery',
    icon: Image,
    label: 'Gallery',
    title: 'Gallery',
    imageSrc: gallery,
    emphasis: [
      'Gallery is only available for Institutions that use Graduation Attire for their photography services.',
    ],
    description: [
      'Once you have crossed the stage and had your onstage photos taken, your onstage photos will appear in your gallery.',
      'You will then be able to select your photo and purchase your photo directly in-app.',
    ],
  },
  {
    id: 'offers',
    icon: Tag,
    label: 'Offers',
    title: 'Offers',
    imageSrc: offers,
    description: [
      'Our offers page will show you fantastic offers from Graduation Attire and partnering companies to give graduates the best bang for their buck!',
      "Our offers will be updated regularly, so keep checking back so you don't miss out!",
    ],
  },
];

export function FeatureShowcase() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleFeatureSelect = (featureId: string) => {
    setSelectedFeature(featureId);
  };

  const handleBack = () => {
    setSelectedFeature(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset selected feature when sheet is closed
      setSelectedFeature(null);
    }
  };

  const selectedFeatureData = featureButtons.find((feature) => feature.id === selectedFeature);

  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: 'beforeChildren',
        staggerChildren: 0.05, // Faster stagger
        duration: 0.15, // Faster overall animation
      },
    },
    exit: {
      opacity: 0,
      transition: {
        when: 'afterChildren',
        staggerChildren: 0.02, // Faster stagger
        staggerDirection: -1,
        duration: 0.15, // Faster exit
      },
    },
  };

  const featureListVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.15 }, // Faster fade in
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.1 }, // Faster fade out
    },
  };

  const featureDetailVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 20, // Less damping for faster movement
        stiffness: 400, // Higher stiffness for faster movement
        mass: 0.8, // Lower mass for faster movement
        duration: 0.2, // Limit maximum duration
      },
    },
    exit: {
      x: '-100%',
      opacity: 0,
      transition: {
        type: 'spring',
        damping: 25, // Less damping for faster movement
        stiffness: 400, // Higher stiffness for faster movement
        mass: 0.8, // Lower mass for faster movement
        duration: 0.2, // Limit maximum duration
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 10 }, // Less movement
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 15, // Less damping for faster movement
        stiffness: 400, // Higher stiffness for faster movement
        duration: 0.15, // Limit maximum duration
      },
    },
    exit: {
      opacity: 0,
      y: 10, // Less movement
      transition: {
        duration: 0.1, // Faster exit
      },
    },
    hover: {
      scale: 1.01, // Smaller scale for faster effect
      transition: {
        type: 'spring',
        damping: 8,
        stiffness: 400,
        duration: 0.1, // Faster hover effect
      },
    },
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <div className="text-center flex flex-col items-center justify-center gap-2 hover:cursor-pointer group">
          <div className="text-foreground group-hover:text-muted-foreground">How it works</div>
          <ChevronDown className="w-8 h-8 text-foreground group-hover:text-muted-foreground" />
        </div>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[80vh] bg-background border-none p-6 sm:p-12 overflow-hidden"
      >
        <div className="container-sm max-w-xl mx-auto">
          <AnimatePresence mode="wait">
            {selectedFeature ? (
              <motion.div
                key="feature-detail"
                variants={featureDetailVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="flex items-center mb-6">
                  <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <SheetTitle className="text-xl text-foreground flex items-center">
                    {selectedFeatureData?.icon && (
                      <selectedFeatureData.icon className="h-5 w-5 mr-2 text-primary" />
                    )}
                    {selectedFeatureData?.title}
                  </SheetTitle>
                </div>

                <div className="flex flex-col items-center">
                  <motion.div
                    className="w-full h-80 bg-muted rounded-lg mb-6 overflow-hidden"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.2 }}
                  >
                    {selectedFeatureData?.imageSrc ? (
                      <div className="w-full h-full relative">
                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                          <motion.div
                            className="w-8 h-8 rounded-full bg-primary/20"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.0, // Faster pulse animation
                              ease: 'easeInOut',
                            }}
                          />
                        </div>
                        <img
                          src={selectedFeatureData.imageSrc}
                          alt={selectedFeatureData.title}
                          className="w-full h-full object-cover"
                          onLoad={(e) => {
                            // Remove loading state when image loads
                            const target = e.target as HTMLImageElement;
                            target.style.opacity = '1';
                            // Hide the loading indicator
                            const parent = target.parentElement;
                            if (parent && parent.firstElementChild) {
                              (parent.firstElementChild as HTMLElement).style.display = 'none';
                            }
                          }}
                          style={{ opacity: 0, transition: 'opacity 0.2s ease' }}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        Feature Image Not Available
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    className="space-y-4 text-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.2 }}
                  >
                    {selectedFeatureData?.emphasis?.map((paragraph, index) => (
                      <motion.p
                        className="text-gradgo-400 font-semibold"
                        key={index}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + index * 0.05, duration: 0.15 }}
                      >
                        {paragraph}
                      </motion.p>
                    ))}
                    {selectedFeatureData?.description.map((paragraph, index) => (
                      <motion.p
                        key={index}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + index * 0.05, duration: 0.15 }}
                      >
                        {paragraph}
                      </motion.p>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="feature-list"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <SheetHeader className="mb-8">
                  <SheetTitle className="text-2xl text-foreground">
                    Grad<span className="text-primary">Go</span> features
                  </SheetTitle>
                  <motion.p className="text-muted-foreground" variants={featureListVariants}>
                    Choose from the options below to learn more about GradGo's amazing features.
                  </motion.p>
                </SheetHeader>

                <div className="space-y-4">
                  {featureButtons.map(({ id, icon: Icon, label }, index) => (
                    <motion.div
                      key={id}
                      variants={buttonVariants}
                      whileHover="hover"
                      custom={index}
                    >
                      <Button
                        variant="ghost"
                        className="w-full h-16 justify-between cursor-pointer text-primary-foreground hover:text-primary-foreground bg-[image:var(--gradient-primary)] hover:bg-primary"
                        onClick={() => handleFeatureSelect(id)}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="size-6 text-primary-foreground" />
                          <span>{label}</span>
                        </div>
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
