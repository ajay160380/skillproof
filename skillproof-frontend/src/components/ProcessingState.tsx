import { Loader } from './Loader';

export function ProcessingState({ label = "PROCESSING VERIFICATION..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader text={label} size="lg" />
    </div>
  );
}
