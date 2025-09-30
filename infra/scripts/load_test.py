#!/usr/bin/env python3
"""
Load testing script for the RapBattle Voter API.
Tests concurrent voting and system performance.
"""

import asyncio
import aiohttp
import time
import uuid
import random
from typing import List, Dict, Any

# Configuration
API_BASE = "http://localhost:8000"
CONCURRENT_USERS = 50
VOTES_PER_USER = 3
BATTLE_ID = "your-battle-id-here"  # Replace with actual battle ID
EVENT_TOKEN = "your-event-token-here"  # Replace with actual token

class LoadTester:
    def __init__(self, api_base: str, battle_id: str, event_token: str):
        self.api_base = api_base
        self.battle_id = battle_id
        self.event_token = event_token
        self.results = []
        self.errors = []
    
    async def simulate_user(self, user_id: int) -> Dict[str, Any]:
        """Simulate a single user voting multiple times."""
        user_results = {
            "user_id": user_id,
            "votes": [],
            "errors": [],
            "start_time": time.time(),
            "end_time": None,
        }
        
        # Generate unique device hash for this user
        device_hash = f"load_test_user_{user_id}_{uuid.uuid4().hex[:8]}"
        
        async with aiohttp.ClientSession() as session:
            for vote_num in range(VOTES_PER_USER):
                try:
                    # Simulate some thinking time
                    await asyncio.sleep(random.uniform(0.1, 0.5))
                    
                    # Make vote request
                    vote_choice = random.choice(["A", "B"])
                    start_time = time.time()
                    
                    async with session.post(
                        f"{self.api_base}/vote",
                        headers={
                            "Authorization": f"Bearer {self.event_token}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "battle_id": self.battle_id,
                            "choice": vote_choice,
                            "device_hash": f"{device_hash}_{vote_num}",
                        }
                    ) as response:
                        end_time = time.time()
                        response_time = end_time - start_time
                        
                        if response.status == 200:
                            result = await response.json()
                            user_results["votes"].append({
                                "vote_num": vote_num,
                                "choice": vote_choice,
                                "response_time": response_time,
                                "success": result.get("success", False),
                                "tally": result.get("tally"),
                            })
                        else:
                            error_text = await response.text()
                            user_results["errors"].append({
                                "vote_num": vote_num,
                                "status": response.status,
                                "error": error_text,
                            })
                
                except Exception as e:
                    user_results["errors"].append({
                        "vote_num": vote_num,
                        "error": str(e),
                    })
        
        user_results["end_time"] = time.time()
        user_results["total_time"] = user_results["end_time"] - user_results["start_time"]
        
        return user_results
    
    async def run_load_test(self, concurrent_users: int):
        """Run the load test with specified number of concurrent users."""
        print(f"Starting load test with {concurrent_users} concurrent users...")
        print(f"Each user will attempt {VOTES_PER_USER} votes")
        print(f"Total expected requests: {concurrent_users * VOTES_PER_USER}")
        print("-" * 50)
        
        start_time = time.time()
        
        # Create tasks for all users
        tasks = [
            self.simulate_user(user_id) 
            for user_id in range(concurrent_users)
        ]
        
        # Run all users concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Process results
        successful_users = []
        failed_users = []
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                failed_users.append({"user_id": i, "error": str(result)})
            else:
                successful_users.append(result)
        
        # Print summary
        print(f"\nLoad Test Complete!")
        print(f"Total time: {total_time:.2f} seconds")
        print(f"Successful users: {len(successful_users)}")
        print(f"Failed users: {len(failed_users)}")
        
        # Calculate statistics
        if successful_users:
            total_votes = sum(len(user["votes"]) for user in successful_users)
            total_errors = sum(len(user["errors"]) for user in successful_users)
            
            response_times = []
            for user in successful_users:
                response_times.extend([vote["response_time"] for vote in user["votes"]])
            
            if response_times:
                avg_response_time = sum(response_times) / len(response_times)
                min_response_time = min(response_times)
                max_response_time = max(response_times)
                
                print(f"\nVote Statistics:")
                print(f"Total successful votes: {total_votes}")
                print(f"Total errors: {total_errors}")
                print(f"Average response time: {avg_response_time:.3f}s")
                print(f"Min response time: {min_response_time:.3f}s")
                print(f"Max response time: {max_response_time:.3f}s")
                
                # Requests per second
                rps = total_votes / total_time
                print(f"Requests per second: {rps:.2f}")
        
        # Show errors
        if failed_users:
            print(f"\nFailed Users:")
            for failed in failed_users:
                print(f"User {failed['user_id']}: {failed['error']}")
        
        # Show some successful vote details
        if successful_users:
            print(f"\nSample Successful Votes:")
            for user in successful_users[:3]:  # Show first 3 users
                print(f"User {user['user_id']}: {len(user['votes'])} votes, {len(user['errors'])} errors")
                for vote in user["votes"][:2]:  # Show first 2 votes per user
                    print(f"  Vote {vote['vote_num']}: {vote['choice']} ({vote['response_time']:.3f}s)")

async def main():
    """Main function to run the load test."""
    print("RapBattle Voter Load Test")
    print("=" * 50)
    
    # Check if battle ID and token are provided
    if BATTLE_ID == "your-battle-id-here" or EVENT_TOKEN == "your-event-token-here":
        print("Please update BATTLE_ID and EVENT_TOKEN in the script before running.")
        print("You can get these by running create_sample_data.py")
        return
    
    # Test API connectivity
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{API_BASE}/healthz") as response:
                if response.status != 200:
                    print(f"API health check failed: {response.status}")
                    return
                print("API health check passed")
    except Exception as e:
        print(f"Failed to connect to API: {e}")
        return
    
    # Run load test
    tester = LoadTester(API_BASE, BATTLE_ID, EVENT_TOKEN)
    await tester.run_load_test(CONCURRENT_USERS)

if __name__ == "__main__":
    asyncio.run(main())
