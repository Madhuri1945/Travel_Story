import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import TravelStoryCard from "../../components/Cards/TravelStoryCard";
import { MdAdd } from "react-icons/md";
import Modal from "react-modal";
import { ToastContainer, toast } from "react-toastify";
import AddEditTravelStory from "./AddEditTravelStory";
import ViewTravelStory from "./ViewTravelStory";
import "react-toastify/dist/ReactToastify.css";
import EmptyCard from "../../components/Cards/EmptyCard";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import moment from "moment/moment";
import FilterInfoTitle from "../../components/Cards/FilterInfoTitle";
function Home() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allStories, setAllStories] = useState([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [openAddEditModel, setOpenAddEditModel] = useState({
    isShown: false,
    type: "add",
    data: null,
  });
  const [openViewModal, setOpenViewModal] = useState({
    isShown: false,
    data: null,
  });
  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      if (response.data && response.data.user) {
        setUserInfo(response.data.user);
      }
    } catch (err) {
      if (err.response.status === 400) {
        localStorage.clear();
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };
  const getAllStories = async () => {
    try {
      const response = await axiosInstance.get("/get-all-stories");

      if (response.data && response.data.stories) {
        setAllStories(response.data.stories);
      } else {
        setAllStories([]);
      }
    } catch (err) {
      console.log(err);
      setAllStories([]);
    } finally {
      setLoadingStories(false);
    }
  };
  const handleEdit = (data) => {
    setOpenAddEditModel({ isShown: true, type: "edit", data: data });
  };
  const handleViewStory = (data) => {
    setOpenViewModal({ isShown: true, data });
  };
  const updateIsFavourite = async (storyData) => {
    const storyId = storyData._id;
    try {
      // Toggle isFavourite status via API
      const response = await axiosInstance.put(
        "/update-is-favourite/" + storyId,
        {
          isFavourite: !storyData.isFavourite,
        }
      );

      // Update local state instead of re-fetching all stories
      if (response.data && response.data.travel) {
        toast.success("Story Updated Successfully");
        if (filterType === "search" && searchQuery) {
          onSearchStory(searchQuery);
        } else if (filterType === "date") {
          filterStoriesByDate(dateRange);
        } else {
          getAllStories();
        }
        // setAllStories((prevStories) =>
        //   prevStories.map((story) =>
        //     story._id === storyId
        //       ? { ...story, isFavourite: !story.isFavourite }
        //       : story
        //   )
        // );
      }
    } catch (err) {
      console.error("An unexpected error occurred", err);
    }
  };
  const deleteTravelStory = async (data) => {
    const storyId = data._id;
    try {
      const response = await axiosInstance.delete("/delete-story/" + storyId);
      if (response.data && !response.data.error) {
        toast.error("Story Deleted Successfully");
        setOpenViewModal((prevState) => ({
          ...prevState,
          isShown: false,
        }));
        getAllStories();
      }
    } catch (err) {
      console.log(err.message);
    }
  };
  const onSearchStory = async (query) => {
    try {
      const response = await axiosInstance.get("/search", {
        params: {
          query,
        },
      });

      if (response.data && response.data.stories) {
        console.log(response.data.stories);
        setFilterType("search");

        setAllStories(response.data.stories);
      }
    } catch (err) {
      console.log(err.message);
    }
  };
  const filterStoriesByDate = async (day) => {
    try {
      const startDate = day.from ? moment(day.from).valueOf() : null; // Convert to ISO string

      const endDate = day.to ? moment(day.to).valueOf() : null;

      if (startDate && endDate) {
        const response = await axiosInstance.get("/travel-stories/filter", {
          params: { startDate, endDate },
        });

        if (response.data && response.data.stories) {
          setFilterType("date");
          setAllStories(response.data.stories);
        } else {
          setAllStories([]); // No stories found
        }
      }
    } catch (err) {
      console.log("An unexpected error occured.Please try again");
    }
  };
  const handleClearSearch = () => {
    // Reset date range
    setFilterType("");
    getAllStories(); // Re-fetch all stories
  };
  const handleDayClick = (day) => {
    setDateRange(day);
    filterStoriesByDate(day); // Trigger filtering by date
  };
  const resetFilter = () => {
    setDateRange({ from: null, to: null });
    setFilterType("");
    getAllStories();
  };
  useEffect(() => {
    getAllStories();
    getUserInfo();

    return () => {};
  }, []);
  if (isLoading || loadingStories) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Navbar
        userInfo={userInfo}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchNote={onSearchStory}
        handleClearSearch={handleClearSearch}
      />

      <div className="container mx-auto py-10">
        <FilterInfoTitle
          filterType={filterType}
          filterDates={dateRange}
          onClear={() => {
            resetFilter();
          }}
        />
        <div className="flex gap-7">
          <div className="flex-1">
            {allStories.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {allStories
                  .slice()
                  .sort((a, b) => b.isFavourite - a.isFavourite)
                  .map((item) => {
                    return (
                      <TravelStoryCard
                        key={item._id}
                        imgUrl={item.imageUrl}
                        title={item.title}
                        story={item.story}
                        date={item.visitedDate}
                        visitedLocation={item.visitedLocation}
                        isFavourite={item.isFavourite}
                        onEdit={() => handleEdit(item)}
                        onClick={() => handleViewStory(item)}
                        onFavouriteClick={() => updateIsFavourite(item)}
                      />
                    );
                  })}
              </div>
            ) : (
              <EmptyCard
                message={`start creating your first Travel Story! Click the 'Add' button to jot down your thoughts,ideas and memories. Let's get Started`}
              />
            )}
          </div>
          <div className="w-[320px]">
            <div className="bg-white border border-slate-200 shadow-lg shadow-slate-200/60 rounded-lg ">
              <div className="p-3">
                <DayPicker
                  captionLayout="dropdown-buttons"
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDayClick}
                  pagedNavigation
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={openAddEditModel.isShown}
        onRequestClose={() => {}}
        style={{
          overlay: {
            backgroundColor: "rgba(0,0,0,0.2)",
            zIndex: 999,
          },
        }}
        appElement={document.getElementById("root")}
        className="model-box scrollbar scrollbar-thumb-cyan-500 scrollbar-track-cyan-200"
      >
        <AddEditTravelStory
          type={openAddEditModel.type}
          storyInfo={openAddEditModel.data}
          onClose={() => {
            setOpenAddEditModel({ isShown: false, type: "add", data: null });
          }}
          getAllStories={getAllStories}
        />
      </Modal>
      <Modal
        isOpen={openViewModal.isShown}
        onRequestClose={() => {}}
        style={{
          overlay: {
            backgroundColor: "rgba(0,0,0,0.2)",
            zIndex: 999,
          },
        }}
        appElement={document.getElementById("root")}
        className="model-box scrollbar scrollbar-thumb-cyan-500 scrollbar-track-cyan-200"
      >
        <ViewTravelStory
          // type={openViewModal.type}
          storyInfo={openViewModal.data || null}
          onClose={() => {
            setOpenViewModal((prevState) => ({ ...prevState, isShown: false }));
          }}
          onEditClick={() => {
            setOpenViewModal((prevState) => ({ ...prevState, isShown: false }));
            handleEdit(openViewModal.data || null);
          }}
          onDeleteClick={() => {
            deleteTravelStory(openViewModal.data || null);
          }}
        />
      </Modal>
      <button
        className="w-16 h-16 flex items-center justify-center rounded-full bg-cyan-500 hover:bg-cyan-400 fixed right-10 bottom-10"
        onClick={() => {
          setOpenAddEditModel({ isShown: true, type: "add", data: null });
        }}
      >
        <MdAdd className="text-[32px] text-white" />
      </button>
      <ToastContainer />
    </div>
  );
}
export default Home;
