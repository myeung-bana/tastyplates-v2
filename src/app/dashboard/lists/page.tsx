// tastyplates-frontend/src/app/dashboard/lists/page.tsx
"use client";

import { useState, useEffect } from "react";
import { lists } from "@/data/dummyList";
import Link from "next/link";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import "@/styles/pages/_lists.scss";
import { PAGE } from "@/lib/utils";
import { DASHBOARD_LISTS } from "@/constants/pages";

interface Restaurant {
  id: string;
  name: string;
  image: string;
  description: string;
  cuisine: string;
  rating?: number;
}

interface List {
  id: string;
  name: string;
  creator: string;
  restaurants: string[];
}

const CURRENT_USER_ID = "123e4567-e89b-12d3-a456-426614174000";

const ListsPage = () => {
  const [restaurantLists, setRestaurantLists] = useState<List[]>([]);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");

  useEffect(() => {
    // Currently filtering 'lists' state instead of imported 'lists' dummy data
    const userLists = lists.filter(
      (list: List) => list.creator === CURRENT_USER_ID
    );
    setRestaurantLists(userLists);
  }, []);

  const handleCreateList = () => {
    if (newListName.trim()) {
      const newList: List = {
        id: crypto.randomUUID(), // Generate new UUID
        name: newListName,
        creator: CURRENT_USER_ID,
        restaurants: [],
      };
      setRestaurantLists([...lists, newList]);
      setNewListName("");
      setIsCreatingList(false);
    }
  };

  const handleDeleteList = (listId: string) => {
    setRestaurantLists(lists.filter((list) => list.id !== listId));
  };

  return (
    <div className="dashboard-content">
      <div className="lists-header">
        <h1 className="dashboard-overview__title">My Restaurant Lists</h1>
        <button
          className="dashboard-button"
          onClick={() => setIsCreatingList(true)}
        >
          <FiPlus /> Create New List
        </button>
      </div>

      {isCreatingList && (
        <div className="create-list-form">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Enter list name"
            className="list-name-input"
          />
          <button className="dashboard-button" onClick={handleCreateList}>
            Create
          </button>
        </div>
      )}

      <div className="lists-container">
        {restaurantLists.map((list) => (
          <div key={list.id} className="list-section">
            <div className="list-header">
              <Link href={PAGE(DASHBOARD_LISTS, [list.id])}>
                <h2>{list.name}</h2>
              </Link>
              <div className="list-actions">
                <button
                  className="icon-button"
                  onClick={() => handleDeleteList(list.id)}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListsPage;
