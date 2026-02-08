<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ScholarshipController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\UserController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Scholarships
    Route::apiResource('scholarships', ScholarshipController::class);
    
    // Applications
    Route::apiResource('applications', ApplicationController::class);
    Route::post('/applications/{id}/submit', [ApplicationController::class, 'submit']);
    Route::post('/applications/{id}/review', [ApplicationController::class, 'review']);
    
    // Users
    Route::get('/user/profile', [UserController::class, 'profile']);
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    
    // Admin routes
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/users', [UserController::class, 'index']);
        Route::get('/admin/stats', [UserController::class, 'stats']);
    });
    
    // Reviewer routes
    Route::middleware('role:reviewer')->group(function () {
        Route::get('/reviewer/applications', [ApplicationController::class, 'reviewerApplications']);
    });
});