import React from "react";
import { getInitials } from "../../utils/helper";
const ProfileInfo = ({ userInfo, onLogout }) => {
  return (
    userInfo && (
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-slate-100 p-2 rounded-full text-slate-950 flex items-center justify-center font-medium">
          {getInitials(userInfo ? userInfo.fullName : "")}
        </div>
        <div>
          <p className="text-sm font-medium">{userInfo.fullName}</p>
          <button
            className="text-sm text-slate-700 underline cursor-pointer"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>
    )
  );
};
export default ProfileInfo;
