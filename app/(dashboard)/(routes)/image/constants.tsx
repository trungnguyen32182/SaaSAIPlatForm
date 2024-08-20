import * as z from "zod";

export const formSchema = z.object({
	prompt: z.string().min(1, {
		message: "Image Prompt is required.",
	}),
	amount: z.string().min(1),
	resolution: z.string().min(1),
});

export const amountOptions = [
	{
		value: "1",
		label: "1 Photo",
	},
	{
		value: "2",
		label: "2 Photos",
	},
	{
		value: "3",
		label: "3 Photos",
	},
	{
		value: "4",
		label: "4 Photos",
	},
	{
		value: "5",
		label: "5 Photos",
	},
];

export const resolutionOptions = [
	{
		value: "square_hd",
		label: "Default",
	},
	{
		value: "square",
		label: "Square",
	},
	{
		value: "portrait_4_3",
		label: "Portrait 4:3",
	},
	{
		value: "portrait_16_9",
		label: "Portrait 16:9",
	},
	{
		value: "landscape_4_3",
		label: "Landscape 4:3",
	},
	{
		value: "landscape_16_9",
		label: "Landscape 16:9",
	},
];
