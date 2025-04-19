import { useStore } from "@tanstack/react-form";

import { useFieldContext, useFormContext } from "../hooks/demo.form-context";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as ShadcnSelect from "@/components/ui/select";
import { Slider as ShadcnSlider } from "@/components/ui/slider";
import { Switch as ShadcnSwitch } from "@/components/ui/switch";
import { Textarea as ShadcnTextarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import type { SlotProps } from "input-otp";
import { Loader } from "lucide-react";
import Password from "./auth/password-field";
import PasswordInputChceker from "./auth/password-input-checker";
import { InputOTP } from "./ui/input-otp";

export function SubscribeButton({
	label,
	isLoading,
}: { label: string; isLoading?: boolean }) {
	const form = useFormContext();
	return (
		<form.Subscribe selector={(state) => state.isSubmitting}>
			{() => (
				<Button type="submit" disabled={isLoading} className="w-full">
					{isLoading ? (
						<Loader className="animate-spin w-6 h-6" />
					) : (
						<>{label}</>
					)}
				</Button>
			)}
		</form.Subscribe>
	);
}

function ErrorMessages({
	errors,
}: {
	errors: Array<string | { message: string }>;
}) {
	return (
		<>
			{errors.map((error) => (
				<div
					key={typeof error === "string" ? error : error.message}
					className="text-red-500 mt-1"
				>
					{typeof error === "string" ? error : error.message}
				</div>
			))}
		</>
	);
}

export const OTPInput = ({
	label,
	maxLength = 8,
}: { label: string; maxLength?: number }) => {
	const field = useFieldContext<string>();
	const errors = useStore(field.store, (state) => state.meta.errors);
	return (
		<div>
			<Label htmlFor={label} className="mb-2 ">
				{label}
			</Label>

			<InputOTP
				maxLength={maxLength}
				render={({ slots }) => (
					<>
						<div className="flex gap-2">
							{slots.slice(0, 4).map((slot, idx) => (
								<Slot key={idx} {...slot} />
							))}
						</div>

						<FakeDash />

						<div className="flex gap-2">
							{slots.slice(4).map((slot, idx) => (
								<Slot key={idx} {...slot} />
							))}
						</div>
					</>
				)}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e)}
			/>
			{field.state.meta.isTouched && <ErrorMessages errors={errors} />}
		</div>
	);
};

interface TextFieldProps extends React.ComponentProps<"input"> {
	label?: string;
}

export function TextField({ label, placeholder, ...props }: TextFieldProps) {
	const field = useFieldContext<string>();
	const errors = useStore(field.store, (state) => state.meta.errors);

	return (
		<div>
			{label && (
				<Label htmlFor={label} className="mb-2 ">
					{label}
				</Label>
			)}

			<Input
				value={field.state.value}
				placeholder={placeholder}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				{...props}
			/>
			{field.state.meta.isTouched && <ErrorMessages errors={errors} />}
		</div>
	);
}

export function PasswordField({
	label,
	placeholder,
	type,
}: {
	label: string;
	placeholder?: string;

	type?: "register" | "login";
}) {
	const field = useFieldContext<string>();
	const errors = useStore(field.store, (state) => state.meta.errors);

	return (
		<div>
			<div className="flex items-center justify-between">
				<Label htmlFor="pwd" className="text-sm text-title">
					{label}
				</Label>
				{type === "login" && (
					<Button asChild variant="link" size="sm">
						<Link
							to="/auth/forgot-password"
							className="link intent-info variant-ghost text-sm"
						>
							Forgot your Password ?
						</Link>
					</Button>
				)}
			</div>

			{type === "register" ? (
				<PasswordInputChceker
					value={field.state.value}
					placeholder={placeholder}
					onBlur={field.handleBlur}
					onChange={(e) => field.handleChange(e.target.value)}
				/>
			) : (
				<Password
					value={field.state.value}
					placeholder={placeholder}
					onBlur={field.handleBlur}
					onChange={(e) => field.handleChange(e.target.value)}
				/>
			)}
			{field.state.meta.isTouched && <ErrorMessages errors={errors} />}
		</div>
	);
}

export function TextArea({
	label,
	rows = 3,
}: {
	label: string;
	rows?: number;
}) {
	const field = useFieldContext<string>();
	const errors = useStore(field.store, (state) => state.meta.errors);

	return (
		<div>
			<Label htmlFor={label} className="mb-2 ">
				{label}
			</Label>
			<ShadcnTextarea
				id={label}
				value={field.state.value}
				onBlur={field.handleBlur}
				rows={rows}
				onChange={(e) => field.handleChange(e.target.value)}
			/>
			{field.state.meta.isTouched && <ErrorMessages errors={errors} />}
		</div>
	);
}

export function Select({
	label,
	values,
	placeholder,
}: {
	label: string;
	values: Array<{ label: string; value: string }>;
	placeholder?: string;
}) {
	const field = useFieldContext<string>();
	const errors = useStore(field.store, (state) => state.meta.errors);

	return (
		<div>
			<ShadcnSelect.Select
				name={field.name}
				value={field.state.value}
				onValueChange={(value) => field.handleChange(value)}
			>
				<ShadcnSelect.SelectTrigger className="w-full">
					<ShadcnSelect.SelectValue placeholder={placeholder} />
				</ShadcnSelect.SelectTrigger>
				<ShadcnSelect.SelectContent>
					<ShadcnSelect.SelectGroup>
						<ShadcnSelect.SelectLabel>{label}</ShadcnSelect.SelectLabel>
						{values.map((value) => (
							<ShadcnSelect.SelectItem key={value.value} value={value.value}>
								{value.label}
							</ShadcnSelect.SelectItem>
						))}
					</ShadcnSelect.SelectGroup>
				</ShadcnSelect.SelectContent>
			</ShadcnSelect.Select>
			{field.state.meta.isTouched && <ErrorMessages errors={errors} />}
		</div>
	);
}

export function Slider({ label }: { label: string }) {
	const field = useFieldContext<number>();
	const errors = useStore(field.store, (state) => state.meta.errors);

	return (
		<div>
			<Label htmlFor={label} className="mb-2 ">
				{label}
			</Label>
			<ShadcnSlider
				id={label}
				onBlur={field.handleBlur}
				value={[field.state.value]}
				onValueChange={(value) => field.handleChange(value[0])}
			/>
			{field.state.meta.isTouched && <ErrorMessages errors={errors} />}
		</div>
	);
}

export function Switch({ label }: { label: string }) {
	const field = useFieldContext<boolean>();
	const errors = useStore(field.store, (state) => state.meta.errors);

	return (
		<div>
			<div className="flex items-center gap-2">
				<ShadcnSwitch
					id={label}
					onBlur={field.handleBlur}
					checked={field.state.value}
					onCheckedChange={(checked) => field.handleChange(checked)}
				/>
				<Label htmlFor={label}>{label}</Label>
			</div>
			{field.state.meta.isTouched && <ErrorMessages errors={errors} />}
		</div>
	);
}

function Slot(props: SlotProps) {
	return (
		<div
			className={cn(
				"flex size-10 items-center justify-center rounded-md border border-input bg-background font-medium text-foreground shadow-xs transition-[color,box-shadow]",
				{ "z-10 border-ring ring-[3px] ring-ring/50": props.isActive },
			)}
		>
			{props.char !== null && <div>{props.char}</div>}
		</div>
	);
}

function FakeDash() {
	return (
		<div className="flex w-10 justify-center items-center">
			<div className="w-3 h-1 rounded-full bg-border" />
		</div>
	);
}
