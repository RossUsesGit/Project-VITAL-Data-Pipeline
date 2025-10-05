//CityComparison.jsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import {
  ResponsiveContainer,
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  BarChart, 
  Bar,       
    Cell,
  XAxis,     
  YAxis,     
  CartesianGrid, 
  Tooltip,   
} from "recharts";
import "leaflet/dist/leaflet.css";
import "./CityComparison.css";

import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// FIX PIN ICON (Question Mark) ISSUE
L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

// Map constraint to prevent infinite scrolling
const WORLD_BOUNDS = [
  [-90, -180], // Southwest coordinates
  [90, 200]    // Northeast coordinates
];

// --- HARDCODED CITY DATA (NO CHANGE, but text formatting fixed below) ---

const INITIAL_CITY_DATA = {
    'Athens': {
        coords: [37.9838, 23.7275],
        info: {
            ULS: 80, // from all_data.csv (80.4 rounded)
            ULS_Category: 'Healthy and Sustainable',
            Population: 3153386,
            Area_km2: 717,
            Urban_Density: 4398,
        },
        metrics: {
            ELI: 77, // VITAL Score
            PAQS: 66,
            HSS: 100,
            WSS: 96,
            UEI: 41,
        },
        descriptions: {
            VITAL_summary: 'Scored above average on VITAL submetrics. Close to targets set by international organizations and institutions.',
            PAQS_desc: 'Moderate Air Quality: tolerable but sensitive groups may be affected; track and improve conditions.',
            HSS_desc: 'Ideal heat conditions; minimal health risk, highly resilient urban environment.',
            WSS_desc: 'Well-Served: Functional systems, most residents have access, with generally low health risks.',
            UEI_NatCover: 'Substantial Progress: Natural Cover percentage of the city area is significant but needs more improvement.',
            UEI_Access: 'Severe Access Deficit: Barely any of the populated and dense areas has access to open spaces with decent greeneries.',

            PDS_long_desc: 'Athens attains a strong Population Density Score (PDS), reflecting that its urban densities are largely within an optimal range for accessibility and service provision. This balance supports efficient mobility and helps limit density-related health risks compared with more overcrowded cities.',
            VITAL_long_desc: 'The VITAL score for Athens (77) indicates above-average performance across environmental submetrics. While the city performs well overall, targeted measures on air quality and equitable green space access would further enhance resilience and public health outcomes.',
            PAQS_long_desc: 'Athens\' PM2.5 Air Quality Score (PAQS) of 66 is categorized as Moderate. The city experiences PM2.5 concentrations that are somewhat above WHO recommended limits, posing elevated risk for sensitive groups and highlighting the need for continued emissions controls and monitoring.',
            HSS_long_desc: 'Athens scores highly on Chronic Heat Safety (CHSS), benefitting from temperate seasonal patterns and urban conditions that limit extreme heat exposure. Existing adaptation measures and urban form contribute to generally low population heat risk.',
            WSS_long_desc: 'With a Water & Sanitation Score (WSS) of 96, Athens is effectively well-served by reliable systems that provide broad access and low public-health risk. Continued maintenance and targeted investments will preserve this high standard.',
            UEI_long_desc: 'The Urban Environmental Integration Score (UEI) for Athens shows meaningful natural cover across the city, but access to these green areas is uneven. Improving distribution and accessibility of green space would boost the city\'s ecosystem services and equitable health benefits.'
        }
    },
    'Cairo': {
        coords: [30.0444, 31.2357],
        info: {
            ULS: 26, // from all_data.csv (25.9 rounded)
            ULS_Category: 'Needs Improvement',
            Population: 22183000,
            Area_km2: 606,
            Urban_Density: 36605.6,
        },
        metrics: {
            ELI: 55,
            PAQS: 16,
            HSS: 100,
            WSS: 73,
            UEI: 59,
        },
        descriptions: {
            VITAL_summary: 'Decently scored in the VITAL submetrics. Meets some of the standards set by international organizations and institutions.',
            PAQS_desc: 'Very Poor Air Quality: Extremely poor air quality with serious health risks; immediate action needed.',
            HSS_desc: 'Ideal heat conditions in the aggregated metrics; heat safety score indicates resilience in the metric used.',
            WSS_desc: 'Developing: Functional systems but service gaps remain for portions of the population.',
            UEI_NatCover: 'Optimal Natural Cover: Natural Cover percentage of the city meets the 30% goal.',
            UEI_Access: 'Severe Access Deficit: Barely any of the populated and dense areas has access to open spaces with decent greeneries.',

            PDS_long_desc: 'Cairo records a low Population Density Score (PDS), reflecting substantial crowding in urban cores and imbalances between density and service provision. This spatial pressure can magnify public-health risks and strain infrastructure where population concentrations are highest.',
            VITAL_long_desc: 'The VITAL score for Cairo (55) signals a mixed performance across core environmental metrics. While some systems show functioning capacity, acute deficits—notably in air quality—significantly reduce the city\'s overall environmental health and resilience.',
            PAQS_long_desc: 'Cairo\'s PM2.5 Air Quality Score (PAQS) of 16 is Very Poor and indicates hazardous annual particulate concentrations with serious implications for respiratory and cardiovascular health. Rapid air-pollution mitigation is an urgent public-health priority.',
            HSS_long_desc: 'Cairo\'s Heat Safety Score is reported high in the aggregated dataset, suggesting that, on average, heat exposure metrics used here do not show extreme chronic heat risk; however, local microclimates and vulnerable populations may still face meaningful heat stress that requires targeted adaptation.',
            WSS_long_desc: 'With a Water & Sanitation Score (WSS) around 73, Cairo is classified as Developing in its service coverage and reliability. While many residents have access, gaps remain that should be addressed to reduce health risks and improve service equity.'
            ,
            UEI_long_desc: 'Cairo\'s Urban Environmental Integration Score (UEI) points to substantial natural cover in parts of the metropolitan area but a pronounced access deficit in dense neighborhoods. Expanding and redistributing green infrastructure would improve local cooling, recreational opportunities, and equitable health outcomes across vulnerable communities.'
        }
    },
    'Istanbul': {
        coords: [41.0082, 28.9784],
        info: {
            ULS: 91, // from all_data.csv (90.8 rounded)
            ULS_Category: 'Healthy and Sustainable',
            Population: 15701602,
            Area_km2: 5343,
            Urban_Density: 2938.7,
        },
        metrics: {
            ELI: 79,
            PAQS: 53,
            HSS: 100,
            WSS: 90,
            UEI: 62,
        },
        descriptions: {
            VITAL_summary: 'Scored above average on VITAL submetrics. Close to targets set by international organizations and institutions.',
            PAQS_desc: 'Moderate Air Quality: tolerable but sensitive groups may be affected; track and improve conditions.',
            HSS_desc: 'Ideal heat conditions; minimal health risk in the aggregated metric.',
            WSS_desc: 'Well-Served: Functional systems, most residents have access.',
            UEI_NatCover: 'Optimal Natural Cover: Natural Cover percentage of the city meets the 30% goal.',
            UEI_Access: 'Limited Access: Some populated and dense areas have access to open spaces with decent greeneries.',

            PDS_long_desc: 'Istanbul attains a very high Population Density Score (PDS), reflecting a favorable balance of density and provision of urban services across much of the metropolitan area. This contributes to good accessibility and efficient service delivery in many districts.',
            VITAL_long_desc: 'The VITAL score for Istanbul (79) indicates robust performance across environmental submetrics, with strengths in water and sanitation and moderate air quality. Continued investment in air-quality management and green infrastructure would further raise resilience.',
            PAQS_long_desc: 'Istanbul\'s PM2.5 Air Quality Score (PAQS) of 53 is Moderate. While the city does not face the most extreme pollution levels, PM2.5 concentrations can still affect sensitive groups and warrant pollution-control measures to improve public health.',
            HSS_long_desc: 'Istanbul scores highly on Chronic Heat Safety (CHSS) in the dataset, reflecting generally manageable heat exposure at the annual scale. Localized hotspots and seasonal heat events, however, should be considered in adaptation planning.',
            WSS_long_desc: 'With a Water & Sanitation Score (WSS) of 90, Istanbul benefits from broadly reliable systems and high coverage, reducing health risks and supporting urban resilience.'
            ,
            UEI_long_desc: 'Istanbul\'s Urban Environmental Integration Score (UEI) indicates strong natural cover across many districts paired with variability in local access. Targeted greening and improved access in underserved dense neighborhoods would amplify cooling, biodiversity, and equitable well-being benefits throughout the metropolis.'
        }
    },
    'Berlin': {
        coords: [52.5200, 13.4050],
        info: {
            ULS: 81, // ULS data key kept for access
            ULS_Category: 'Healthy and Sustainable',
            Population: 3769495,
            Area_km2: 891,
            Urban_Density: 4230.6,
        },
        metrics: {
            ELI: 89, // ELI data key kept for access
            PAQS: 83,
            HSS: 95, 
            WSS: 99,
            UEI: 83,
        },
        descriptions: { 
            VITAL_summary: 'Scored above average on VITAL submetrics. Close to targets set by international organizations and institutions.',
            PAQS_desc: 'Good: Average PM2.5 level is within safe limits set by the WHO.',
            HSS_desc: 'Excellent Heat Safety: Low heat stress with effective urban cooling strategies.', 
            WSS_desc: 'Well-Served: Functional systems, most residents have access, with generally low health risks.',
            UEI_NatCover: 'Optimal Natural Cover: Natural Cover percentage of the city meets 30% goal, providing improved quality of health and life.',
            UEI_Access: 'Broad Access: A significant majority of dense areas have access to open spaces with decent greeneries.',

            // --- ADVANCED/LONG DESCRIPTIONS ---
            PDS_long_desc: 'Berlin achieved a high Population Density Score (PDS) of 81, classifying it as Healthy and Sustainable. This robust score, which aggregates various livability metrics, reflects a strong commitment to environmental and social infrastructure, placing it well above average among global cities. Its success is heavily supported by near-perfect Water & Sanitation infrastructure and an excellent VITAL score.',
            VITAL_long_desc: 'The VITAL score for Berlin is 89, signifying exceptional environmental quality and sustainability measures. This is driven by strong scores across all sub-metrics, positioning the city close to the targets set by major international health and environmental organizations for urban living.',
            PAQS_long_desc: 'Berlin’s PM2.5 Air Quality Score (PAQS) of 83 is categorized as Good. This score confirms that the annual average concentration of fine particulate matter (PM2.5) is within the safe limits recommended by the World Health Organization (WHO), indicating a generally healthy urban atmosphere.',
            HSS_long_desc: 'Berlin benefits from its temperate climate, resulting in an Excellent Heat Safety Score (HSS). This score suggests the city experiences minimal extreme heat events compared to tropical counterparts and has robust, effective long-term urban cooling strategies, such as ample green space and moderate urbanization density, to mitigate heat island effects during summer spikes.',
            WSS_long_desc: 'With a near-perfect score of 99, Berlin’s Water and Sanitation Score (WSS) is categorized as Well-Served. This confirms the presence of highly functional water and sanitation systems, ensuring almost all residents have reliable access to safe drinking water and adequate sanitation, with generally negligible associated health risks.',
            UEI_long_desc: 'The Urban Environmental Integration Score (UEI) is high (83), reflecting an Optimal Natural Cover, where the city meets the target of 30% natural cover. Furthermore, the Broad Access classification for green spaces indicates that a significant majority of its dense areas have access to quality open spaces, greatly enhancing public health and quality of life.'
        }
    },
    'Delhi': {
        coords: [28.7041, 77.1025],
        info: {
            ULS: 41,
            ULS_Category: 'Needs Improvement',
            Population: 30291000,
            Area_km2: 1484,
            Urban_Density: 20411.7,
        },
        metrics: {
            ELI: 56,
            PAQS: 1,
            HSS: 50, 
            WSS: 60,
            UEI: 80,
        },
        descriptions: {
            VITAL_summary: 'Decently scored in the VITAL submetrics. Meets some of the standards set by international organizations and institutions.',
            PAQS_desc: 'Critical: PM2.5 level is far above safe limits set by the WHO.',
            HSS_desc: 'Needs Improvement: Severe heat stress experienced annually, with inadequate mitigation strategies.', 
            WSS_desc: 'Developing: Partial progress, but service gaps remain.',
            UEI_NatCover: 'Optimal Natural Cover: Natural Cover percentage of the city meets 30% goal, providing improved quality of health and life.',
            UEI_Access: 'Partial Access: Approximately half of the dense areas have access to open spaces with decent greeneries.',
            
            // --- ADVANCED/LONG DESCRIPTIONS ---
            PDS_long_desc: 'Delhi’s Population Density Score (PDS) of 41 falls into the Needs Improvement category, primarily due to critically low scores in the Air Quality (PAQS) metric. Despite performing well in Urban Environmental Integration (UEI), the severe environmental challenges significantly pull down its overall livability ranking compared to global averages.',
            VITAL_long_desc: 'The VITAL score for Delhi is 56, indicating a mixed performance. While efforts are made in certain environmental sectors, the city faces significant hurdles, especially in air quality. This score meets only some of the basic standards set by international health and environmental institutions.',
            PAQS_long_desc: 'Delhi’s PM2.5 Air Quality Score (PAQS) of 1 is critically low. This score indicates that the average annual concentration of fine particulate matter (PM2.5) is dramatically far above the safe limits set by the WHO, posing extreme and urgent public health risks related to respiratory and cardiovascular diseases.',
            HSS_long_desc: 'The Heat Safety Score (HSS) reflects significant heat stress experienced annually in Delhi, categorized as Needs Improvement. While some adaptation is present, the city requires greater and more effective heat mitigation strategies to protect its large population from severe and chronic heat risks during the hotter seasons.',
            WSS_long_desc: 'The Water and Sanitation Score (WSS) of 60 places Delhi in the Developing category. This signifies partial progress toward universal coverage, but service gaps remain. Focused efforts are necessary to close access and quality gaps in water provision and sanitation services for all residents.',
            UEI_long_desc: 'The Urban Environmental Integration Score (UEI) is 80. Delhi scores well in this area, benefiting from an Optimal Natural Cover meeting the 30% goal. The green space access, however, is classified as Partial Access, highlighting an imbalance in distribution across the urban core.'
        }
    },
    'Lagos': {
        coords: [6.5244, 3.3792],
        info: {
            ULS: 52,
            ULS_Category: 'Unhealthy',
            Population: 15600000,
            Area_km2: 1171,
            Urban_Density: 13321.9,
        },
        metrics: {
            ELI: 50,
            PAQS: 18,
            HSS: 40, 
            WSS: 23,
            UEI: 62,
        },
        descriptions: {
            VITAL_summary: 'Scored below average in most of VITAL submetrics. Below safe thresholds set by international organizations and institutions.',
            PAQS_desc: 'Poor: PM2.5 level is significantly above safe limits set by the WHO.',
            HSS_desc: 'Poor Heat Safety: High heat stress and high humidity, requiring urgent adaptation measures.', 
            WSS_desc: 'Critical: Critical water and sanitation deficits, urgent action needed.',
            UEI_NatCover: 'Optimal Natural Cover: Natural Cover percentage of the city meets 30% goal, providing improved quality of health and life.',
            UEI_Access: 'Limited Access: Some populated and dense areas have access to open spaces with decent greeneries.',
            
            // --- ADVANCED/LONG DESCRIPTIONS ---
            PDS_long_desc: 'Lagos is classified as Unhealthy with a Population Density Score (PDS) of 52. The city faces critical infrastructural deficits, most notably in its Water and Sanitation systems. While it surprisingly achieves Optimal Natural Cover, the lack of basic service provision in dense areas significantly undermines its livability and necessitates urgent intervention across core public services.',
            VITAL_long_desc: 'The VITAL score for Lagos is 50, indicating that most sub-metrics fall below safe thresholds set by international institutions. The city is grappling with combined challenges in air quality and critical service gaps, suggesting a need for broad environmental policy and infrastructure upgrades to improve resident health outcomes.',
            PAQS_long_desc: 'Lagos’s PM2.5 Air Quality Score (PAQS) of 18 is rated as Poor. With a score of 18, the concentration of PM2.5 is significantly above the WHO’s safe limits. This points to substantial pollution sources (e.g., traffic, industry) that require strict regulation and public policy changes to mitigate health risks.',
            HSS_long_desc: 'Lagos holds a Poor Heat Safety Score (HSS) of 40. Situated in a tropical zone with high heat and humidity year-round, the city faces severe heat stress risks. This low score underscores the need for urgent adaptation measures, including expansion of cooling infrastructure and better planning for urban heat islands.',
            WSS_long_desc: 'The Water and Sanitation Score (WSS) is Critical at 23. This is the most severe deficit among all assessed cities, indicating critical service gaps, high health risks from contaminated water, and inadequate sanitation infrastructure. Immediate and massive investment in water and sanitation systems is required.',
            UEI_long_desc: 'The Urban Environmental Integration Score (UEI) is 62. Despite its challenges, Lagos achieves Optimal Natural Cover, meeting the 30% goal for the city area. However, the Access component is only Limited, suggesting that while green space exists, it is not sufficiently accessible to all populated and dense urban areas, reducing its benefit to the wider population.'
        }
    },
    'Manila': {
        coords: [14.5995, 120.9842],
        info: {
            ULS: 21,
            ULS_Category: 'Unhealthy',
            Population: 19025900,
            Area_km2: 43.7, 
            Urban_Density: 43537.5, 
        },
        metrics: {
            ELI: 43,
            PAQS: 27,
            HSS: 30, 
            WSS: 58,
            UEI: 15,
        },
        descriptions: {
            VITAL_summary: 'Scored below average in most of VITAL submetrics. Below safe thresholds set by international organizations and institutions.',
            PAQS_desc: 'Poor: PM2.5 level is significantly above safe limits set by the WHO.',
            HSS_desc: 'Critical Heat Safety: Extreme heat and humidity combined with high density create critical heat risks.', 
            WSS_desc: 'Developing: Partial progress, but service gaps remain.',
            UEI_NatCover: 'Critical Environmental Deficit: City’s natural cover needs immediate attention and care.',
            UEI_Access: 'Severe Access Deficit: Barely any of the populated and dense areas has access to open spaces with decent greeneries.',
            
            // --- ADVANCED/LONG DESCRIPTIONS ---
            PDS_long_desc: 'Manila receives the lowest Population Density Score (PDS) at 21, classified as Unhealthy. Its low ranking is driven by severe deficits in almost all environmental metrics, particularly Urban Environmental Integration (UEI), compounded by extremely high urban density, leading to critical environmental and public health risks.',
            VITAL_long_desc: 'The VITAL score for Manila is 43, reflecting that environmental quality and sustainability measures are well below the safe thresholds set by international organizations. Significant, concerted efforts are required across air quality, heat safety, and green infrastructure to improve the living environment.',
            PAQS_long_desc: 'Manila’s PM2.5 Air Quality Score (PAQS) is Poor (27). Like other dense metropolises in developing regions, pollution from traffic and industry results in PM2.5 levels significantly exceeding WHO safety limits, creating chronic respiratory health challenges for its dense population.',
            HSS_long_desc: 'The Heat Safety Score (HSS) of 30 is Critical. The combination of its tropical climate (extreme heat and humidity) and its status as one of the world’s densest cities results in magnified urban heat island effects and extreme heat risks. Comprehensive and urgent city-wide cooling and adaptation strategies are mandatory.',
            WSS_long_desc: 'The Water and Sanitation Score (WSS) is Developing (58). While showing partial progress, service gaps remain, especially in ensuring universal and reliable access to safe water and sanitation. These gaps are often concentrated in informal or highly dense settlements.',
            UEI_long_desc: 'The Urban Environmental Integration Score (UEI) is 15. Manila has a critical deficiency in this area due to a Critical Environmental Deficit in natural cover and a Severe Access Deficit, meaning barely any of the populated, dense areas have access to green open spaces.'
        }
    },
    'New York': {
        coords: [40.7128, -74.0060],
        info: {
            ULS: 58,
            ULS_Category: 'Healthy and Sustainable',
            Population: 8467513,
            Area_km2: 789,
            Urban_Density: 10732,
        },
        metrics: {
            ELI: 83,
            PAQS: 93,
            HSS: 80,
            WSS: 96,
            UEI: 69,
        },
        descriptions: {
            VITAL_summary: 'Scored above average on VITAL submetrics. Close to targets set by international organizations and institutions.',
            PAQS_desc: 'Very Good: Average PM2.5 level is well below safe limits set by the WHO.',
            HSS_desc: 'Good Heat Safety: Experiences significant heat, but mitigation measures are generally effective.', 
            WSS_desc: 'Well-Served: Functional systems, most residents have access, with generally low health risks.',
            UEI_NatCover: 'Optimal Natural Cover: Natural Cover percentage of the city meets 30% goal, providing improved quality of health and life.',
            UEI_Access: 'Limited Access: Some populated and dense areas have access to open spaces with decent greeneries.',
            
            // --- ADVANCED/LONG DESCRIPTIONS ---
            PDS_long_desc: 'New York achieves a Population Density Score (PDS) of 58, classified as Healthy and Sustainable. This high score is driven by excellent Air Quality and Water & Sanitation systems. While its VITAL score is strong, its Urban Environmental Integration (UEI) suggests potential for better distribution of green space accessibility in high-density zones.',
            VITAL_long_desc: 'The VITAL score for New York is 83, indicating the city is close to meeting global best-practice targets for urban environmental health. Its air and water quality are standouts, although the city must contend with the significant summer heat waves typical of its latitude.',
            PAQS_long_desc: 'New York’s PM2.5 Air Quality Score (PAQS) of 93 is Very Good. This means the average annual PM2.5 level is well below the safe limits set by the WHO, reflecting effective clean air policies and relatively low industrial pollution in the urban center.',
            HSS_long_desc: 'New York’s Heat Safety Score (HSS) is Good (80). While the city experiences significant heat and humidity during summer months, mitigation measures, public cooling centers, and urban planning are generally effective. The score acknowledges the heat risk but highlights relative success in managing it.',
            WSS_long_desc: 'New York has a Well-Served WSS of 96. Its water and sanitation systems are highly functional and reliable, ensuring access for most residents and contributing minimally to public health risks. It is a benchmark city for water and sanitation infrastructure.',
            UEI_long_desc: 'The Urban Environmental Integration Score (UEI) is 69. The city achieves Optimal Natural Cover across its area, meeting the 30% goal. However, the distribution of this greenery is uneven, leading to a Limited Access classification, as some populated and dense areas lack easy access to these open green spaces.'
        }
    },
    'Paris': {
        coords: [48.8566, 2.3522],
        info: {
            ULS: 100,
            ULS_Category: 'Healthy and Sustainable',
            Population: 2166423,
            Area_km2: 1054,
            Urban_Density: 2054.5,
        },
        metrics: {
            ELI: 83,
            PAQS: 77,
            HSS: 95,
            WSS: 98,
            UEI: 39,
        },
        descriptions: {
            VITAL_summary: 'Scored above average on VITAL submetrics. Close to targets set by international organizations and institutions.',
            PAQS_desc: 'Good: Average PM2.5 level is within safe limits set by the WHO.',
            HSS_desc: 'Excellent Heat Safety: Low heat stress with effective urban cooling strategies.', 
            WSS_desc: 'Well-Served: Functional systems, most residents have access, with generally low health risks.',
            UEI_NatCover: 'Moderate Environmental Deficit: Natural Cover percentage of the city area meets approximately half of the healthy goal.',
            UEI_Access: 'Limited Access: Some populated and dense areas have access to open spaces with decent greeneries.',

            // --- ADVANCED/LONG DESCRIPTIONS ---
            PDS_long_desc: 'Paris achieves the highest possible Population Density Score (PDS) of 100, classifying it as Healthy and Sustainable. This reflects exceptional environmental quality and strong infrastructure, particularly in water and sanitation. Its overall score is slightly mitigated only by a Moderate Environmental Deficit in natural cover, which is a key area for future development.',
            VITAL_long_desc: 'The VITAL score for Paris is 83, indicating the city scores above average across all environmental sub-metrics and is close to global targets. The city generally offers a high-quality living environment relative to its international peers.',
            PAQS_long_desc: 'Paris’s PM2.5 Air Quality Score (PAQS) is categorized as Good (77). The average PM2.5 level is comfortably within the safe limits set by the WHO, but continued vigilance is necessary, especially during periods of high traffic or adverse weather conditions, to maintain this standing.',
            HSS_long_desc: 'Paris, despite experiencing heat waves, earns an Excellent Heat Safety Score (HSS) of 95 due to its predominantly temperate climate. The score reflects strong proactive adaptation and mitigation efforts, though recent summer heat spikes suggest future planning must prioritize climate resilience.',
            WSS_long_desc: 'Paris’s Water and Sanitation Score (WSS) is Well-Served at 98. It boasts highly effective and comprehensive systems, similar to Berlin and New York, ensuring minimal public health risks associated with water and sanitation access or quality.',
            UEI_long_desc: 'The Urban Environmental Integration Score (UEI) is 39. Paris faces a challenge in this area due to a Moderate Environmental Deficit in Natural Cover, meaning the percentage of natural cover meets only approximately half of the healthy goal. Access to green spaces is also classified as Limited in many dense areas.'
        }
    },
    'São Paulo': {
        coords: [-23.5505, -46.6333],
        info: {
            ULS: 75,
            ULS_Category: 'Moderate',
            Population: 12325232,
            Area_km2: 1521,
            Urban_Density: 8103.4,
        },
        metrics: {
            ELI: 74,
            PAQS: 67,
            HSS: 70,
            WSS: 75,
            UEI: 66,
        },
        descriptions: {
            VITAL_summary: 'Scored above average on VITAL submetrics. Close to targets set by international organizations and institutions.',
            PAQS_desc: 'Moderate: PM2.5 level is slightly above safe limits set by the WHO.',
            HSS_desc: 'Moderate Heat Safety: Tropical climate with moderate heat stress, requiring better urban mitigation.', 
            WSS_desc: 'Developing: Partial progress, but service gaps remain.',
            UEI_NatCover: 'Moderate Environmental Deficit: Natural Cover percentage of the city area meets approximately half of the healthy goal.',
            UEI_Access: 'Partial Access: Approximately half of the dense areas have access to open spaces with decent greeneries.',
            
            // --- ADVANCED/LONG DESCRIPTIONS ---
            PDS_long_desc: 'São Paulo’s Population Density Score (PDS) of 75 is classified as Moderate. The city achieves generally solid environmental metrics (VITAL), but its score is hampered by a Moderate Air Quality rating and Water & Sanitation systems still classified as Developing. It is a large metropolitan area facing typical challenges of scale.',
            VITAL_long_desc: 'The VITAL score for São Paulo is 74, which is above average, placing the city close to the targets set by international institutions. The city performs respectably in managing environmental challenges but has room for improvement in air quality and water service coverage.',
            PAQS_long_desc: 'São Paulo’s PM2.5 Air Quality Score (PAQS) of 67 is Moderate. The average PM2.5 level is slightly above the safe limits set by the WHO, indicating a mild, but persistent air quality challenge that requires minor interventions and policy adjustments to fully comply with health guidelines.',
            HSS_long_desc: 'The Heat Safety Score (HSS) is Moderate (70). Located in a tropical zone, the city experiences inherent heat stress. This score suggests that while basic mitigation is in place, the city requires more focused urban planning and infrastructure investments to effectively counteract the heat stress typical of its climate.',
            WSS_long_desc: 'São Paulo’s Water and Sanitation Score (WSS) is Developing (75). This means partial progress has been made toward universal access, but service gaps still exist, especially in peripheral or rapidly developing areas. Further expansion and stabilization of services are required.',
            UEI_long_desc: 'The Urban Environmental Integration Score (UEI) is 66. The city is facing a Moderate Environmental Deficit in natural cover. However, its efforts in green space accessibility are better, with a Partial Access rating, meaning approximately half of its dense areas have reasonable access to open green spaces.'
        }
    },
};

// --- END OF HARDCODED CITY DATA ---


// Helper to assign a color based on the ULS Category
const getCategoryColor = (category) => {
    switch (category) {
        case 'Very Healthy':
        case 'Healthy and Sustainable':
        case 'Healthy':
            return '#2ecc71'; // Green
        case 'Moderate':
            return '#f39c12'; // Orange
        case 'Needs Improvement':
        case 'Poor':
            return '#e67e22'; // Dark Orange
        case 'Unhealthy':
            return '#e74c3c'; // Red
        default:
            return '#95a5a6'; // Gray
    }
};

// Helper to assign a color based on the raw score value
const getScoreColor = (score) => {
    if (score > 80) return '#4CAF50'; // Green (Healthy)
    if (score > 50) return '#FFC107'; // Yellow/Amber (Moderate)
    return '#F44336'; // Red (Unhealthy/Poor)
};


// Component for the colorful progress bars
const MetricScoreBar = ({ score, label }) => {
    const barColor = getScoreColor(score);
    return (
        <div className="metric-score-bar-container">
            <span className="metric-label">{label}</span> 
            <div className="bar-wrapper">
                <div 
                    className="score-bar" 
                    style={{ width: `${score}%`, backgroundColor: barColor }}
                ></div>
                <span className="score-value">{score}%</span>
            </div>
        </div>
    );
};


// Custom Marker Icon Generation
const createCustomMarker = (color) => {
    return new L.Icon({
        iconUrl: `data:image/svg+xml;base64,${btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style="fill:${color};stroke:#fff;stroke-width:2;">
                <path d="M16 0C9.92 0 4.8 5.12 4.8 11.2c0 9 11.2 20.8 11.2 20.8s11.2-11.8 11.2-20.8C27.2 5.12 22.08 0 16 0zm0 16a4.8 4.8 0 1 1 0-9.6 4.8 4.8 0 0 1 0 9.6z"/>
            </svg>
        `)}`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
};


const CityMap = React.memo(({ onCityClick, data, selectedCities }) => {
    const center = useMemo(() => {
        if (selectedCities.length === 1) {
            return data[selectedCities[0]]?.coords || [20, 0];
        }
        return [20, 0];
    }, [selectedCities, data]);


    return (
        <MapContainer
            className="map-container"
            center={center}
            zoom={selectedCities.length === 1 ? 5 : 2}
            minZoom={2}
            maxBounds={WORLD_BOUNDS}
            maxBoundsViscosity={1.0}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="&copy; Esri"
            />
            {Object.keys(data).map((city) => {
                const cityInfo = data[city];
                const isSelected = selectedCities.includes(city);
                // Use fixed blue for selected, otherwise use category color
                const markerColor = isSelected ? '#3f51b5' : getCategoryColor(cityInfo.info.ULS_Category); 
                const customIcon = createCustomMarker(markerColor);

                return (
                    <Marker 
                        key={city} 
                        position={cityInfo.coords} 
                        icon={customIcon}
                        eventHandlers={{ click: () => onCityClick(city) }}
                        opacity={isSelected ? 1.0 : 0.8}
                    >
                        {/* ULS is displayed as PDS */}
                        <Popup>{city} ({cityInfo.info.ULS_Category} - PDS: {cityInfo.info.ULS})</Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
});


// --- HORIZONTAL BAR CHART COMPONENT ---
const HorizontalBarChartComparison = ({ data, metricKey, title }) => {
    
    // Transform data for Bar Chart (metricKey must be ULS, ELI, or UEI here)
    const barData = data.map((city) => {
        let score = 0;
        if (metricKey === 'ULS') {
            score = INITIAL_CITY_DATA[city]?.info[metricKey] || 0; // PDS uses ULS data key
        } else {
            score = INITIAL_CITY_DATA[city]?.metrics[metricKey] || 0; // VITAL uses ELI data key
        }
        return { city, score };
    });
    
    // Sort bars ascending for vertical axis display
    barData.sort((a, b) => a.score - b.score); 

    return (
        <div className="chart-card">
            <h4>{title} Comparison</h4>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart 
                    data={barData} 
                    layout="vertical" 
                    margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    {/* YAxis shows the city names (categorical axis) */}
                    <YAxis dataKey="city" type="category" tick={{ fontSize: 11 }} width={80} /> 
                    {/* XAxis shows the score (numerical axis) */}
                    <XAxis 
                        domain={[0, 100]} 
                        type="number" 
                        tick={{ fontSize: 10 }} 
                        label={{ value: 'Score (%)', position: 'bottom', offset: 0, fontSize: 10 }}
                    />
                    {/* custom tooltip to show only city name and score */}
                    <Tooltip content={<CustomTooltip />} />
                    {/* Bars are rendered horizontally; use Cell to color individual bars */}
                    <Bar dataKey="score" name="Score" label={{ position: 'right', fill: '#333', fontSize: 10 }}>
                        {barData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

// Custom tooltip component for the horizontal bar charts
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const score = payload[0]?.value;
    return (
        <div className="custom-tooltip">
            <div className="custom-tooltip-label">{label}</div>
            <div className="custom-tooltip-score">Score: <span className="custom-tooltip-number">{score}</span></div>
        </div>
    );
};


// --- MAIN COMPARISON COMPONENT ---
export default function CityComparison() {
    // Moved data outside useState for efficiency, assuming it's static.
    const cityData = INITIAL_CITY_DATA; 
    const [loading] = useState(false); 
    const [cityToView, setCityToView] = useState(null);
    const [selectedCities, setSelectedCities] = useState([]);
    const [isAdvancedMode, setIsAdvancedMode] = useState(false); 
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // Sidebar state
    const [isPopupOpen, setIsPopupOpen] = useState(false); // Popup state
    const [isSettingsPopupOpen, setIsSettingsPopupOpen] = useState(false); // Settings popup state
    const [isDarkMode, setIsDarkMode] = useState(false); // Dark mode state (overlay + popup + sidebar)

    
    // Handlers for state management
    const handleCityClick = useCallback((city) => {
        setCityToView(city);
    }, []);

    const handleCompare = useCallback((city) => {
        if (!selectedCities.includes(city) && selectedCities.length < 4) {
            setSelectedCities((prev) => [...prev, city]);
            setCityToView(null); 
        }
    }, [selectedCities]);

    const handleRemoveCity = useCallback((city) => {
        setSelectedCities((prev) => prev.filter((c) => c !== city));
        setIsAdvancedMode(false); 
    }, []);
    
    const handleClearAll = useCallback(() => {
        setSelectedCities([]);
        setCityToView(null); 
        setIsAdvancedMode(false); 
    }, []);
    
    const toggleAdvancedMode = useCallback(() => { 
        setIsAdvancedMode((prev) => !prev);
    }, []);

    // Toggle sidebar expansion
    const toggleSidebar = () => {
        setIsSidebarExpanded((prev) => !prev);
    };

    // Toggle popup visibility
    const togglePopup = () => {
        setIsPopupOpen((prev) => !prev);
    };

    // Toggle settings popup visibility
    const toggleSettingsPopup = () => {
        setIsSettingsPopupOpen((prev) => !prev);
    };

    // Toggle dark mode and persist to localStorage
    const toggleDarkMode = () => {
        setIsDarkMode((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('darkMode', next ? '1' : '0');
            } catch (e) {
                // ignore localStorage errors (e.g., SSR or privacy settings)
            }
            return next;
        });
    };

    // Read initial dark mode preference from localStorage on mount
    useEffect(() => {
        try {
            const v = localStorage.getItem('darkMode');
            if (v === '1') setIsDarkMode(true);
        } catch (e) {
            // ignore
        }
    }, []);

    // Radar Chart Data Calculation (Memoized for efficiency)
    const radarData = useMemo(() => {
        // ULS is PDS, ELI is VITAL
        const metricsKeys = ['ELI', 'ULS', 'PAQS', 'HSS', 'UEI', 'WSS']; 
        
        return metricsKeys.map((metric) => {
            const entry = { metric };
            let displayName = metric;
            
            switch(metric) {
                // RENAME ULS TO PDS
                case 'ULS': displayName = 'PDS'; break; 
                // RENAME ELI TO VITAL
                case 'ELI': displayName = 'VITAL'; break; 
                case 'PAQS': displayName = 'PAQS'; break;
                case 'HSS': displayName = 'HSS'; break;
                case 'UEI': displayName = 'UEI'; break;
                case 'WSS': displayName = 'WSS'; break;
                default: displayName = metric;
            }
            entry.metric = displayName;

            selectedCities.forEach((city) => {
                const data = cityData[city];
                if (data) {
                    // ULS (PDS) is in info, others are in metrics
                    if (metric === 'ULS') {
                        entry[city] = data.info.ULS;
                    } else {
                        entry[city] = data.metrics[metric];
                    }
                }
            });
            return entry;
        });
    }, [selectedCities, cityData]);

    // Determine if the overlay should be open
    const isOverlayOpen = selectedCities.length > 0 || cityToView;

    // Force a resize event when overlay opens/closes (Crucial for Leaflet and Recharts)
    useEffect(() => {
        if (isOverlayOpen || isAdvancedMode) {
            // Delay is necessary to ensure the map/charts recalculate size after the container becomes visible/changes layout
            setTimeout(() => window.dispatchEvent(new Event("resize")), 100); 
        }
    }, [isOverlayOpen, isAdvancedMode]);

    // Function to format numbers with commas
    const formatNumber = (num) => num ? num.toLocaleString('en-US') : 'N/A';

    if (loading) {
        return <div className="loading-message">Loading city data...</div>;
    }
    
    const currentCityData = cityToView ? cityData[cityToView] : null;
    const metricLabels = [
        'VITAL score', // Renamed
        'PDS (Population Density Score)',
        'PAQS (Air Quality Score)',
        'HSS (Heat Safety Score)',
        'WSS (Water & Sanitation Score)',
        'UEI (Urban Environmental Integration Score)',
    ];

    const metricKeyMap = {
        'PDS (Population Density Score)': 'PDS_long_desc',
        'VITAL score': 'VITAL_long_desc', // Renamed
        'PAQS (Air Quality Score)': 'PAQS_long_desc',
        'HSS (Heat Safety Score)': 'HSS_long_desc',
        'WSS (Water & Sanitation Score)': 'WSS_long_desc',
        'UEI (Urban Environmental Integration Score)': 'UEI_long_desc', 
    };

    return (
        <div className={`comparison-container ${isDarkMode ? 'dark-mode' : ''}`}>
            {/* Left Sidebar */}
            <div className={`left-sidebar ${isSidebarExpanded ? "expanded" : "contracted"}`}>
                <img
                  src="/projectvital4.png"
                  alt="Project Vital Logo"
                  className="sidebar-logo"
                  onClick={toggleSidebar}
                />
                {isSidebarExpanded && (
                  <>
                    <h3>A Multi-Dimensional Non-Linear Framework for Urban Resilience</h3>
                    <p>Version 1.0</p>
                    <p className="settings" onClick={toggleSettingsPopup}>Settings</p>
                    <p className="about-us" onClick={togglePopup}>About Us</p>
                  </>
                )}
            </div>

            {isPopupOpen && (
              <div className="popup-overlay" onClick={togglePopup}>
                <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                  <h2>About Project V.I.T.A.L.</h2>
                  <h3>Our Mission</h3>
                  <p>
                    Project V.I.T.A.L. strives to provide simple, comparable, data-driven intelligence on Urban Health and Sustainability in the world’s largest cities. Our mission is to make sense of complex environmental data and share this knowledge in ways that empower city planners, researchers, and community members to create healthier and more resilient cities.
                  </p>
                  <h3>The V.I.T.A.L. Framework</h3>
                  <p>
                    Our platform utilizes the proprietary VITAL Score (Vitality and Environmental Living Index) to rank a city’s operation across six core dimensions of urban health:
                  </p>
                  <ul>
                    <li><strong>PDS (Population Density Score):</strong> An overall score that captures livability and density management.</li>
                    <li><strong>PAQS (Air Quality Score):</strong> The level of fine particulates (PM2.5) compared to WHO guidelines.</li>
                    <li><strong>HSS (Heat Safety Score):</strong> A city’s ability to manage chronic heat stress and or heat safety.</li>
                    <li><strong>WSS (Water & Sanitation Score):</strong> Functional access to essential water and sanitation systems.</li>
                    <li><strong>UEI (Urban Environmental Integration Score):</strong> The level of natural cover present in a city and functional access to green spaces for residents.</li>
                    <li><strong>VITAL score:</strong> The summary score for environmental conditions.</li>
                  </ul>
                  <p>
                    These scores can be normalized onto a 0-100 scale, allowing a transparent side-by-side comparison of global cities, identifying areas of strength and areas of need.
                  </p>
                  <button onClick={togglePopup}>Close</button>
                </div>
              </div>
            )}

                        {isSettingsPopupOpen && (
                            <div className="popup-overlay" onClick={toggleSettingsPopup}>
                                <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                                    <h2>Settings</h2>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                                        <button className="close-view-btn" onClick={toggleDarkMode}>
                                            {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                        </button>
                                        <span style={{ fontSize: '0.9rem' }}>{isDarkMode ? 'Dark mode is ON' : 'Dark mode is OFF'}</span>
                                    </div>
                                    <div style={{ marginTop: '12px' }}>
                                        <button onClick={toggleSettingsPopup}>Close</button>
                                    </div>

                                </div>
                            </div>
                        )}

            <CityMap 
                onCityClick={handleCityClick} 
                data={cityData} 
                selectedCities={selectedCities}
            />
            
            <div className={`overlay ${isOverlayOpen ? "open" : ""}`}>
                <h2>City Livability and Comparison</h2>
                
                {/* SECTION FOR SINGLE CITY VIEW (Detailed Info) */}
                {cityToView && currentCityData && (
                    <div className="view-card-wrapper">
                        <div className="view-card">
                            <div className="card-header">
                                <h3>{cityToView} Details</h3>
                                <button className="close-view-btn" onClick={() => setCityToView(null)}>Close</button>
                            </div>

                            <div className="uls-summary">
                                {/* ELI is now VITAL */}
                                <p className="main-score" style={{ color: getCategoryColor(currentCityData.info.ULS_Category) }}>
                                    VITAL: <strong>{currentCityData.metrics.ELI}</strong>
                                </p>
                                {/* ULS is now PDS */}
                                <span className="uls-category-tag" style={{ backgroundColor: getCategoryColor(currentCityData.info.ULS_Category) }}>
                                    {currentCityData.info.ULS_Category} (PDS: {currentCityData.info.ULS})
                                </span>
                            </div>

                            {/* TEXT DESIGN FIX: Removed ** from the summary. Using <strong> for VITAL Summary label. */}
                            <p className="city-description-full">
                                <strong>VITAL Summary:</strong> {currentCityData.descriptions.VITAL_summary || "No detailed VITAL summary available."}
                            </p>
                            
                            <hr />

                            <div className="data-grid">
                                <h4>Key Metrics</h4>
                                <p><strong>Population:</strong> {formatNumber(currentCityData.info.Population)}</p>
                                <p><strong>Area:</strong> {formatNumber(currentCityData.info.Area_km2)} km²</p>
                                <p><strong>Density:</strong> {formatNumber(currentCityData.info.Urban_Density)} /km²</p>
                                
                                <h4>Environmental Scores</h4>
                                <p><strong>PAQS:</strong> {currentCityData.metrics.PAQS}</p>
                                <p><strong>HSS:</strong> {currentCityData.metrics.HSS}</p>
                                <p><strong>WSS:</strong> {currentCityData.metrics.WSS}</p>
                                <p><strong>UEI:</strong> {currentCityData.metrics.UEI}</p>
                            </div>

                            <hr />
                            <div className="description-summary">
                                <h4>Sub-Metric Description Summary</h4>
                                <p>
                                    <strong>Air Quality (PAQS):</strong> {currentCityData.descriptions.PAQS_desc || 'N/A'}
                                </p>
                                <p>
                                    <strong>Heat Safety (HSS):</strong> {currentCityData.descriptions.HSS_desc || 'N/A'} 
                                </p>
                                <p>
                                    <strong>Water & Sanitation (WSS):</strong> {currentCityData.descriptions.WSS_desc || 'N/A'}
                                </p>
                                <p>
                                    <strong>Urban Integration (UEI):</strong> 
                                    {/* TEXT DESIGN FIX: Removed ** from the line below */}
                                    <br/> - Natural Cover: {currentCityData.descriptions.UEI_NatCover || 'N/A'}
                                    <br/> - Access: {currentCityData.descriptions.UEI_Access || 'N/A'}
                                </p>
                            </div>
                            
                            {/* Comparison Button */}
                            {selectedCities.length < 4 && !selectedCities.includes(cityToView) ? (
                                <button className="compare-btn" onClick={() => handleCompare(cityToView)}>
                                    Compare City ({selectedCities.length}/4)
                                </button>
                            ) : (
                                <p className="max-compare-msg">
                                    {selectedCities.includes(cityToView) ? 'Already in comparison.' : 'Maximum 4 cities selected.'}
                                </p>
                            )}
                        </div>
                    </div>
                )}
                
                {/* COMPARISON SECTION (Radar Chart and Side-by-Side Cards) */}
                {selectedCities.length > 0 && (
                    <>
                        <div className="chart-section">
                            <h3 className="chart-title">Comparison Dashboard ({selectedCities.length} Cities)</h3>
                            <ResponsiveContainer width="100%" height={350}>
                                <RechartsRadarChart outerRadius="70%" data={radarData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <PolarGrid stroke="#ddd" />
                                    {/* Updated Axis label */}
                                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#333', fontSize: 11 }} /> 
                                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#aaa" />
                                    <Legend wrapperStyle={{ fontSize: '12px' }}/>
                                    {/** Use a fixed 4-color palette assigned by the selected city index (order of placement). */}
                                    {/** This ensures up to 4 distinct colors regardless of score/category. */}
                                    {(() => {
                                        const palette = ['#1f77b4', '#ff7f0e', '#2ca02c', '#9467bd']; // blue, orange, green, purple
                                        return selectedCities.map((city, idx) => {
                                            const color = palette[idx % palette.length];
                                            return (
                                                <Radar
                                                    key={city}
                                                    name={city}
                                                    dataKey={city}
                                                    stroke={color}
                                                    fill={color}
                                                    fillOpacity={0.45}
                                                    dot={true}
                                                    strokeWidth={2}
                                                />
                                            );
                                        });
                                    })()}
                                </RechartsRadarChart>
                            </ResponsiveContainer>
                        </div>
                        
                        {/* Clear All Button Repositioned */}
                        <div className="comparison-actions-top">
                            <button className="clear-all-btn" onClick={handleClearAll}>Clear All Comparison</button>
                        </div>
                        
                        {/* Side-by-Side City Cards (Detailed Summary) */}
                        <div className="city-info-cards">
                            {selectedCities.map((city) => (
                            <div key={city} className="city-card-compare">
                                <div className="card-header">
                                    <h3>{city}</h3>
                                    <button className="remove-btn" onClick={() => handleRemoveCity(city)}>Remove</button>
                                </div>
                                
                                <span className="uls-category-tag small-tag" style={{ backgroundColor: getCategoryColor(cityData[city].info.ULS_Category) }}>
                                    {cityData[city].info.ULS_Category}
                                </span>

                                <p className="uls-score-compare">VITAL: <strong>{cityData[city].metrics.ELI}%</strong></p>

                                <div className="metric-score-bars">
                                    {/* Show VITAL first as the primary focus */}
                                    <MetricScoreBar label="VITAL score" score={cityData[city].metrics.ELI} />
                                    <MetricScoreBar label="PDS (Population Density Score)" score={cityData[city].info.ULS} />
                                    <MetricScoreBar label="PAQS (Air Quality Score)" score={cityData[city].metrics.PAQS} />
                                    <MetricScoreBar label="HSS (Heat Safety Score)" score={cityData[city].metrics.HSS} />
                                    <MetricScoreBar label="WSS (Water & Sanitation Score)" score={cityData[city].metrics.WSS} />
                                    <MetricScoreBar label="UEI (Urban Env. Integration Score)" score={cityData[city].metrics.UEI} />
                                </div>
                            </div>
                            ))}
                        </div>

                        {/* ADVANCE MODE TOGGLE BUTTON */}
                        <div className="comparison-actions-bottom">
                            <button className="advance-toggle-btn" onClick={toggleAdvancedMode}>
                                {isAdvancedMode ? 'Hide Advanced Details' : 'Show Advanced Details (Charts & Full Descriptions)'}
                            </button>
                        </div>

                        {/* ADVANCED COMPARISON MODE SECTION */}
                        {isAdvancedMode && (
                            <div className="advanced-mode-section">
                                <hr />
                                <h3>Advanced Comparison Mode</h3>

                                {/* Horizontal Bar Charts for key indices (PDS, VITAL, UEI) */}
                                <div className="advanced-charts-container">
                                    <HorizontalBarChartComparison 
                                        data={selectedCities} 
                                        metricKey="ELI" 
                                        title="VITAL score" 
                                    />
                                    <HorizontalBarChartComparison 
                                        data={selectedCities} 
                                        metricKey="ULS" 
                                        title="Population Density Score (PDS)" 
                                    />
                                     <HorizontalBarChartComparison 
                                        data={selectedCities} 
                                        metricKey="UEI" 
                                        title="Urban Env. Integration Score (UEI)" 
                                    />
                                </div>

                                {/* Full Descriptions */}
                                <div className="full-descriptions-container">
                                    <h4>Detailed Metric Explanations</h4>
                                    {metricLabels.map((metricLabel, index) => (
                                        <div key={index} className="metric-detail-block">
                                            <h5 className="metric-title">{metricLabel}</h5>
                                            <div className="city-descriptions-row">
                                                {selectedCities.map((city) => (
                                                    <div key={city} className="city-description-item">
                                                        <h6>{city}</h6>
                                                        {/* TEXT DESIGN FIX: Removed ** from the line below */}
                                                        <p>
                                                            {cityData[city]?.descriptions[metricKeyMap[metricLabel]] || 'No detailed description available.'}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                            <hr />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                    </>
                )}

                {/* Message when nothing is selected */}
                {!isOverlayOpen && (
                    <div className="empty-chart">
                        <p>Click a city marker on the map to view its details and add it for comparison (Max 4).</p>
                    </div>
                )}
            </div>
        </div>
    );
}