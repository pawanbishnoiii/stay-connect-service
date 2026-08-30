
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nearby_listings(numeric, numeric, numeric, text, int) TO anon, authenticated;

INSERT INTO public.categories (name, slug, kind, icon, color, sort_order) VALUES
('Library','library','property','BookOpen','#6366f1',1),
('Gym','gym','property','Dumbbell','#f97316',2),
('PG','pg','property','Building2','#10b981',3),
('Hostel','hostel','property','Hotel','#0ea5e9',4),
('Rooms & Flats','rooms','property','Home','#8b5cf6',5),
('Tiffin','tiffin','service','UtensilsCrossed','#ef4444',6),
('Washing & Press','laundry','service','Shirt','#06b6d4',7),
('Electrician','electrician','service','Zap','#eab308',8),
('Cleaning','cleaning','service','Sparkles','#14b8a6',9),
('Food','food','service','Pizza','#f43f5e',10)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.subcategories (category_id, name, slug, sort_order)
SELECT c.id, s.name, s.slug, s.ord FROM public.categories c
JOIN (VALUES
 ('library','Girls','girls',1),('library','Boys','boys',2),('library','Common','common',3),
 ('pg','Girls','girls',1),('pg','Boys','boys',2),('pg','Common','common',3),
 ('hostel','Girls','girls',1),('hostel','Boys','boys',2),('hostel','Common','common',3),
 ('rooms','Girls','girls',1),('rooms','Boys','boys',2),('rooms','Common','common',3),
 ('gym','Men','men',1),('gym','Women','women',2),('gym','Common','common',3),
 ('tiffin','Veg','veg',1),('tiffin','Non-Veg','non-veg',2),('tiffin','Both','both',3),
 ('laundry','Per Kg','per-kg',1),('laundry','Per Cloth','per-cloth',2),('laundry','Ironing','ironing',3),('laundry','Dry Cleaning','dry-cleaning',4),
 ('electrician','AC','ac',1),('electrician','Fan','fan',2),('electrician','Wiring','wiring',3),('electrician','Appliance','appliance',4),('electrician','Motor','motor',5),
 ('cleaning','Home','home',1),('cleaning','Deep Cleaning','deep',2),('cleaning','Bathroom','bathroom',3),('cleaning','Kitchen','kitchen',4),('cleaning','Office','office',5),
 ('food','Veg','veg',1),('food','Non-Veg','non-veg',2),('food','Both','both',3)
) AS s(cat,name,slug,ord) ON s.cat = c.slug
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO public.amenities (name, slug, icon, group_name) VALUES
('Fan','fan','Fan','basic'),('AC','ac','AirVent','basic'),('WiFi','wifi','Wifi','basic'),
('Washing Machine','washing-machine','WashingMachine','utility'),('Parking','parking','Car','utility'),
('Fridge','fridge','Refrigerator','utility'),('Cooler','cooler','Wind','basic'),
('Study Desk','desk','Table','study'),('Chair','chair','Armchair','study'),
('Hot Water','hot-water','Droplets','utility'),('Common Bathroom','common-bathroom','Bath','bathroom'),
('Private Bathroom','private-bathroom','Bath','bathroom'),('Kitchen','kitchen','CookingPot','utility'),
('TV','tv','Tv','entertainment'),('Power Backup','power-backup','BatteryCharging','utility'),
('RO Water','ro-water','GlassWater','utility'),('CCTV','cctv','Cctv','safety'),
('Lift','lift','ArrowUpDown','utility'),('Laundry','laundry','Shirt','utility'),
('Food','food','UtensilsCrossed','food'),('Mess','mess','ChefHat','food'),
('Housekeeping','housekeeping','Sparkles','utility'),('Wardrobe','wardrobe','Shirt','basic'),
('Balcony','balcony','Blinds','basic'),('Terrace','terrace','Building','basic')
ON CONFLICT (slug) DO NOTHING;
