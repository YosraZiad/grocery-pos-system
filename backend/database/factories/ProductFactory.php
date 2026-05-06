<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => 1, // سيتم override في الاختبارات
            'category_id' => \App\Models\Category::factory(), // سيتم override في الاختبارات
            'name' => fake()->words(3, true),
            'barcode' => fake()->unique()->ean13(),
            'purchase_price' => fake()->randomFloat(2, 5, 50),
            'sale_price' => fake()->randomFloat(2, 10, 100),
            'quantity' => fake()->numberBetween(0, 1000),
            'expiry_date' => fake()->dateTimeBetween('now', '+1 year'),
            'min_stock_alert' => 5,
            'min_expiry_alert' => 7,
        ];
    }
}
