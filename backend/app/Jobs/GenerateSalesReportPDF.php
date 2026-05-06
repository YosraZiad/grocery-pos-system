<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Dompdf\Dompdf;
use Dompdf\Options;

class GenerateSalesReportPDF implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected array $reportData;
    protected string $filename;
    protected int $tenantId;

    /**
     * Create a new job instance.
     */
    public function __construct(array $reportData, string $filename, int $tenantId)
    {
        $this->reportData = $reportData;
        $this->filename = $filename;
        $this->tenantId = $tenantId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $options = new Options();
        $options->set('defaultFont', 'Arial');
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);

        $dompdf = new Dompdf($options);

        // Generate HTML from report data
        $html = view('reports.sales-pdf', ['data' => $this->reportData])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        // Save PDF to storage
        $pdfPath = storage_path("app/reports/{$this->filename}.pdf");
        
        if (!file_exists(storage_path('app/reports'))) {
            mkdir(storage_path('app/reports'), 0755, true);
        }

        file_put_contents($pdfPath, $dompdf->output());

        \Log::info("Sales report PDF generated: {$this->filename}", [
            'tenant_id' => $this->tenantId,
            'size' => filesize($pdfPath),
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        \Log::error('PDF generation job failed', [
            'tenant_id' => $this->tenantId,
            'filename' => $this->filename,
            'error' => $exception->getMessage(),
        ]);
    }
}
